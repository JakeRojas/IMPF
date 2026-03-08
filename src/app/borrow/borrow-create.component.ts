import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

import { RoomService, BorrowService, AlertService } from '@app/_services';


@Component({
  selector: 'app-borrow-create',
  templateUrl: './borrow-create.component.html'
})
export class BorrowCreateComponent implements OnInit {
  form: FormGroup;
  rooms: any[] = [];
  itemsOptions: any[] = []; // batches/items for the selected room
  submitting = false;
  loadingRooms = false;
  loadingItems = false;
  created: any;

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private borrowService: BorrowService,
    private alert: AlertService,
    private router: Router
  ) {
    this.form = this.fb.group({
      roomId: [null, Validators.required],
      items: this.fb.array([this.createItemGroup()])
    });
  }

  ngOnInit(): void {
    this.loadRooms();

    // when room changes, reload items for that room
    this.form.get('roomId')?.valueChanges.subscribe(id => {
      this.onRoomSelected(id);
    });
  }

  // helpers
  get items(): FormArray { return this.form.get('items') as FormArray; }

  createItemGroup() {
    return this.fb.group({
      itemId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: ['']
    });
  }

  addItem() {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number) {
    if (this.items.length === 1) return; // keep at least one
    this.items.removeAt(index);
  }

  loadRooms() {
    this.loadingRooms = true;
    this.roomService.listRooms().pipe(first()).subscribe({
      next: (res: any[]) => { this.rooms = res || []; this.loadingRooms = false; },
      error: (err) => { this.loadingRooms = false; this.alert.error(err); }
    });
  }

  onRoomSelected(roomId: number | null) {
    this.itemsOptions = [];
    if (!roomId) return;

    this.loadingItems = true;
    this.roomService.getItemsByRoom(+roomId).pipe(first()).subscribe({
      next: (res: any[]) => {
        this.itemsOptions = res || [];
        // reset each itemId control (so user must reselect appropriate item from the new room)
        this.items.controls.forEach(g => g.get('itemId')?.setValue(null));
        this.loadingItems = false;
        if (this.itemsOptions.length === 0) {
          this.alert.warn('No items found in this room.');
        }
      },
      error: (err) => { this.loadingItems = false; this.alert.error(err); }
    });
  }

  // Build the array of payloads and send one request per item (like item-request)
  submit() {
    if (this.form.invalid) {
      console.warn('Form is invalid! Values:', this.form.value);
      this.alert.error('Please complete the form (Check room, items, and quantities)');
      return;
    }

    const roomId = +this.form.value.roomId;
    if (!Number.isFinite(roomId) || roomId <= 0) { this.alert.error('Invalid room'); return; }

    // Read items from the form (each itemId may be null at this point)
    const items = this.form.value.items as Array<{ itemId: any, quantity: any, note?: string }>;

    console.log('Building payloads for items:', items);
    try {
      const payloads = items.map(it => {
        if (!it.itemId) throw new Error('One or more items are not selected');
        const parts = String(it.itemId).split('|');
        const itemType = parts[0] || null;
        const itemId = parts[1] ? Number(parts[1]) : null;

        if (!itemId || isNaN(itemId)) throw new Error('Invalid item selected');

        return {
          roomId,
          itemId,
          itemType,
          quantity: it.quantity != null ? Number(it.quantity) : 1,
          note: it.note || ''
        };
      });

      console.log('Payloads prepared:', payloads);
      if (payloads.length === 0) throw new Error('No items to borrow');

      this.submitting = true;
      const calls = payloads.map(p => this.borrowService.create(p));
      forkJoin(calls).pipe(first()).subscribe({
        next: () => {
          this.alert.success('Borrow request(s) created');
          this.submitting = false;
          this.router.navigate(['/borrow']);
        },
        error: (err) => {
          this.submitting = false;
          console.error('Server error during borrow create:', err);
          const msg = err.error?.message || err.message || JSON.stringify(err);
          this.alert.error('Server error: ' + msg);
        }
      });
    } catch (err: any) {
      this.submitting = false;
      console.error('Validation error before submit:', err);
      this.alert.error(err.message || err);
    }
  }

}
