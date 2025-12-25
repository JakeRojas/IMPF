import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { RoomService, ItemRequestService, AlertService } from '@app/_services';

@Component({ templateUrl: './item-request.create.component.html' })
export class ItemRequestCreateComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  // rooms the requester is in charge of
  requesterRooms: any[] = [];

  // rooms that are stockroom/substockroom (for requestToRoomId)
  stockRooms: any[] = [];

  // items for selected requestToRoomId
  items: any[] = [];

  loading = false;
  loadingItems = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private itReqService: ItemRequestService,
    private alert: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      requesterRoomId: [null, Validators.required],
      requestToRoomId: [null, Validators.required],
      itemId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: ['']
    });

    this.loadRequesterRooms();
    this.loadStockRooms();

    // when requestToRoomId changes, reset items and load items for that room
    this.form.get('requestToRoomId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.items = [];
      this.form.get('itemId')!.setValue(null);
      if (!id) return;
      this.loadItemsForRoom(Number(id));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRequesterRooms() {
    this.loading = true;
    this.roomService.getRooms().pipe(first()).subscribe({
      next: (res: any[]) => {
        // assume getRooms() returns only rooms where user is in charge (per your backend)
        this.requesterRooms = Array.isArray(res) ? res : [];
        this.loading = false;
      },
      error: e => {
        this.loading = false;
        this.alert.error(this.errToString(e));
      }
    });
  }

  private loadStockRooms() {
    this.loading = true;
    const svcAny = this.roomService as any;

    // prefer a dedicated method if present
    const getAll = typeof svcAny.getAllRooms === 'function' ? svcAny.getAllRooms() : this.roomService.listRooms();

    // getAll may be Observable or Promise — handle Observable (common)
    (getAll as any).pipe ? (getAll as any).pipe(first()).subscribe({
      next: (res: any[]) => { this.stockRooms = this.filterStockRooms(res || []); this.loading = false; },
      error: (err: any) => { this.loading = false; this.alert.error(this.errToString(err)); }
    }) : Promise.resolve(getAll).then((res: any[]) => {
      this.stockRooms = this.filterStockRooms(res || []);
      this.loading = false;
    }).catch((err: any) => { this.loading = false; this.alert.error(this.errToString(err)); });
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

    // selected item: used to optionally attach itemType if present
    const selectedItem = this.items.find(it => Number(it.inventoryId ?? it.id) === Number(v.itemId)) || null;

    const payload: any = {
      requesterRoomId: Number(v.requesterRoomId),
      requestToRoomId: Number(v.requestToRoomId),
      itemId: Number(v.itemId),
      quantity: Number(v.quantity),
      note: v.note || null
    };

    if (selectedItem && selectedItem.itemType) payload.itemType = selectedItem.itemType;

    // accountId is set by backend from req.user — do not send it
    this.itReqService.create(payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Item request created');
        this.router.navigate(['/req-item']);
      },
      error: e => this.alert.error(this.errToString(e))
    });
  }

  // small util
  private errToString(err: any): string {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }
}
