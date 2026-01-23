import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { first, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { RoomService, ItemRequestService, AlertService } from '@app/_services';

@Component({ templateUrl: './item-request.create.component.html' })
export class ItemRequestCreateComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  requesterRooms: any[] = [];
  stockRooms: any[] = [];
  items: any[] = []; // available items for selected stockroom

  loading = false;
  loadingItems = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private itReqService: ItemRequestService,
    private alert: AlertService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      requesterRoomId: [null, Validators.required],
      requestToRoomId: [null, Validators.required],
      note: [''],
      items: this.fb.array([this.createItemFormGroup()])
    });

    this.loadRequesterRooms();
    this.loadStockRooms();

    // when requestToRoomId changes, reset items array and load items for that room
    this.form.get('requestToRoomId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.items = [];
      // clear items form array
      while (this.itemsFormArray.length !== 0) {
        this.itemsFormArray.removeAt(0);
      }
      this.addItem(); // add at least one blank row

      if (!id) return;
      this.loadItemsForRoom(Number(id));
    });
  }

  get itemsFormArray() {
    return this.form.get('items') as FormArray;
  }

  createItemFormGroup(): FormGroup {
    const group = this.fb.group({
      itemId: [null, Validators.required],
      otherItemName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: ['']
    });

    group.get('itemId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const otherCtrl = group.get('otherItemName')!;
      if (val === 'other') {
        otherCtrl.setValidators([Validators.required]);
      } else {
        otherCtrl.clearValidators();
        otherCtrl.setValue('');
      }
      otherCtrl.updateValueAndValidity();
    });

    return group;
  }

  addItem() {
    this.itemsFormArray.push(this.createItemFormGroup());
  }

  removeItem(index: number) {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    } else {
      this.alert.warn('Must have at least one item');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRequesterRooms() {
    this.loading = true;
    this.roomService.getRooms().pipe(first()).subscribe({
      next: (res: any[]) => {
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
    const getAll = typeof svcAny.getAllRooms === 'function' ? svcAny.getAllRooms() : this.roomService.listRooms();
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
    const itemsPayload = v.items.map((it: any) => {
      const selectedItem = this.items.find(si => Number(si.inventoryId ?? si.id) === Number(it.itemId)) || null;
      return {
        itemId: it.itemId === 'other' ? null : Number(it.itemId),
        otherItemName: it.itemId === 'other' ? it.otherItemName : null,
        quantity: Number(it.quantity),
        note: it.note || null,
        itemType: selectedItem?.itemType || null
      };
    });

    const payload = {
      requesterRoomId: Number(v.requesterRoomId),
      requestToRoomId: Number(v.requestToRoomId),
      note: v.note || null,
      items: itemsPayload
    };

    this.itReqService.create(payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Item request created with ' + itemsPayload.length + ' item(s)');
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
