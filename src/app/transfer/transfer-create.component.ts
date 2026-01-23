import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { RoomService, TransferService, AlertService } from '@app/_services';

@Component({ templateUrl: './transfer-create.component.html' })
export class TransferCreateComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  fromRooms: any[] = [];   // rooms current user is in charge of
  toRooms: any[] = [];     // rooms with roomType stockroom/substockroom
  items: any[] = [];

  loading = false;
  loadingItems = false;
  maxItemQty = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private transferService: TransferService,
    private alert: AlertService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      fromRoomId: [null, Validators.required],
      toRoomId: [null, Validators.required],
      itemId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: ['']
    });

    this.loadFromRooms();
    this.loadToRooms();

    // when fromRoom changes, reset items and load items for that room
    this.form.get('fromRoomId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.items = [];
      this.form.get('itemId')!.setValue(null);
      this.maxItemQty = 0;
      if (!id) return;
      this.loadItemsForRoom(Number(id));
    });

    // when itemId changes, set max quantity
    this.form.get('itemId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(itemId => {
      const selected = this.items.find(it => String(it.inventoryId ?? it.id) === String(itemId));
      if (selected) {
        this.maxItemQty = Number(selected.totalQuantity || 0);
        this.form.get('quantity')!.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.maxItemQty)
        ]);
      } else {
        this.maxItemQty = 0;
        this.form.get('quantity')!.setValidators([Validators.required, Validators.min(1)]);
      }
      this.form.get('quantity')!.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFromRooms() {
    this.loading = true;
    this.roomService.getRooms().pipe(first()).subscribe({
      next: (res: any[]) => { this.fromRooms = Array.isArray(res) ? res : []; this.loading = false; },
      error: e => { this.loading = false; this.alert.error(this.errToString(e)); }
    });
  }

  private loadToRooms() {
    this.loading = true;
    const svcAny = this.roomService as any;
    const getAll = typeof svcAny.getAllRooms === 'function' ? svcAny.getAllRooms() : this.roomService.listRooms();

    // support Observable or Promise
    if ((getAll as any).pipe) {
      (getAll as any).pipe(first()).subscribe({
        next: (res: any[]) => { this.toRooms = this.filterStockRooms(res || []); this.loading = false; },
        error: (err: any) => { this.loading = false; this.alert.error(this.errToString(err)); }
      });
    } else {
      Promise.resolve(getAll).then((res: any[]) => {
        this.toRooms = this.filterStockRooms(res || []);
        this.loading = false;
      }).catch((err: any) => { this.loading = false; this.alert.error(this.errToString(err)); });
    }
  }

  private filterStockRooms(list: any[]) {
    return (list || []).filter(r => {
      const rt = String((r?.roomType ?? '')).toLowerCase();
      return rt === 'stockroom' || rt === 'substockroom';
    });
  }

  private loadItemsForRoom(roomId: number) {
    this.loadingItems = true;
    this.roomService.getItemsByRoom(roomId).pipe(first()).subscribe({
      next: (res: any[]) => { this.items = Array.isArray(res) ? res : []; this.loadingItems = false; },
      error: e => { this.loadingItems = false; this.alert.error(this.errToString(e)); }
    });
  }

  submit() {
    if (!this.form.valid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;

    const selectedItem = this.items.find(it => Number(it.inventoryId ?? it.id) === Number(v.itemId)) || null;

    const payload: any = {
      fromRoomId: Number(v.fromRoomId),
      toRoomId: Number(v.toRoomId),
      itemId: Number(v.itemId),
      quantity: Number(v.quantity),
      note: v.note || null
    };

    // include itemType only if the item object already contains it (optional)
    if (selectedItem && selectedItem.itemType) payload.itemType = selectedItem.itemType;

    // createdBy is set by backend from the logged-in user
    this.transferService.create(payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Transfer created');
        // adjust route to your transfers list route if different
        this.router.navigate(['/transfer']);
      },
      error: e => this.alert.error(this.errToString(e))
    });
  }

  private errToString(err: any): string {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }
}
