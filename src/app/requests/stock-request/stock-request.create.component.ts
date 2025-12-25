import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { RoomService, StockRequestService, AlertService } from '@app/_services';

@Component({ 
  templateUrl: './stock-request.create.component.html' 
})
export class StockRequestCreateComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  rooms: any[] = [];
  items: any[] = [];
  loading = false;
  loadingItems = false;

  private destroy$ = new Subject<void>();

  constructor(
  private fb: FormBuilder,
  private roomService: RoomService,
  private sr: StockRequestService,
  private alert: AlertService,
  private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
    requesterRoomId: [null, Validators.required],
    itemId: [null, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    note: ['']
  });
  
  this.loadRooms();
  
  // when requesterRoomId changes, load the items for that room
  this.form.get('requesterRoomId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
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
    
  private loadRooms() {
    this.loading = true;
    this.roomService.getRooms().pipe(first()).subscribe({
      next: (res: any[]) => { this.rooms = res || []; this.loading = false; },
      error: e => { this.loading = false; this.alert.error(this._errToString(e)); }
    });
  }
    
  private loadItemsForRoom(roomId: number) {
    this.loadingItems = true;
    this.roomService.getItemsByRoom(roomId).pipe(first()).subscribe({
      next: (res: any[]) => { this.items = res || []; this.loadingItems = false; },
      error: e => { this.loadingItems = false; this.alert.error(this._errToString(e)); }
    });
  }

  submit() {
    if (!this.form.valid) { this.form.markAllAsTouched(); return; }
    
    const v = this.form.value;
    
    // try to find the selected item to read its itemType (if backend still expects it)
    const selected = this.items.find(i => Number(i.inventoryId ?? i.id ?? i.inventoryId) === Number(v.itemId)) || null;
    
    const payload: any = {
      requesterRoomId: Number(v.requesterRoomId),
      itemId: Number(v.itemId),
      quantity: Number(v.quantity),
      note: v.note || null
    };
    
    // keep this optional: if the server still expects itemType include it from the item list
    if (selected && selected.itemType) payload.itemType = selected.itemType;
    
    // we do NOT send accountId here — the backend should set it from the authenticated user.
    this.sr.create(payload).pipe(first()).subscribe({
      next: () => { this.alert.success('Stock request created'); this.router.navigate(['/req-stock']); },
      error: e => this.alert.error(this._errToString(e))
    });
  }
    
  private _errToString(err: any): string {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }
}