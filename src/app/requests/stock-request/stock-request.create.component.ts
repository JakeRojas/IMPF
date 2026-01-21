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
  selectedRoomType: string | null = null;

  // Options for dropdowns
  apparelLevels = ['pre', 'elem', '7', '8', '9', '10', 'sh', 'it', 'hs', 'educ', 'teachers'];
  apparelTypes = ['uniform', 'pe'];
  apparelFors = ['boys', 'girls'];
  apparelSizes = ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl'];
  supplyMeasures = ['pc', 'box', 'bottle', 'pack', 'ream', 'meter', 'roll', 'gallon', 'unit', 'educ', 'teachers'];
  genItemTypes = ['it', 'maintenance', 'unknownType'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private sr: StockRequestService,
    private alert: AlertService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      requesterRoomId: [null, Validators.required],
      itemId: [null, Validators.required],
      otherItemName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: [''],
      // Dynamic fields
      apparelLevel: ['teachers'],
      apparelType: ['uniform'],
      apparelFor: ['boys'],
      apparelSize: ['m'],
      supplyMeasure: ['pc'],
      genItemType: ['unknownType'],
      genItemSize: ['']
    });

    // Listen to itemId changes
    this.form.get('itemId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateDynamicValidators();
    });

    this.loadRooms();

    // when requesterRoomId changes, load the items for that room and update type
    this.form.get('requesterRoomId')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.items = [];
      this.form.get('itemId')!.setValue(null);

      const foundRoom = this.rooms.find(r => r.roomId == id);
      // 'stockroomType' exists on room model
      this.selectedRoomType = foundRoom ? (foundRoom.stockroomType || '').toLowerCase() : null;

      this.updateDynamicValidators();

      if (!id) return;
      this.loadItemsForRoom(Number(id));

    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateDynamicValidators() {
    const isOther = this.form.get('itemId')?.value === 'other';
    const roomType = this.selectedRoomType;

    const otherNameCtrl = this.form.get('otherItemName')!;
    const appLevelCtrl = this.form.get('apparelLevel')!;
    const appTypeCtrl = this.form.get('apparelType')!;
    const appForCtrl = this.form.get('apparelFor')!;
    const appSizeCtrl = this.form.get('apparelSize')!;
    const supMeasureCtrl = this.form.get('supplyMeasure')!;
    const genTypeCtrl = this.form.get('genItemType')!;
    const genSizeCtrl = this.form.get('genItemSize')!;

    // Clear all first
    otherNameCtrl.clearValidators();
    appLevelCtrl.clearValidators();
    appTypeCtrl.clearValidators();
    appForCtrl.clearValidators();
    appSizeCtrl.clearValidators();
    supMeasureCtrl.clearValidators();
    genTypeCtrl.clearValidators();
    // genSize is optional usually

    if (isOther) {
      otherNameCtrl.setValidators([Validators.required]);

      if (roomType === 'apparel') {
        appLevelCtrl.setValidators([Validators.required]);
        appTypeCtrl.setValidators([Validators.required]);
        appForCtrl.setValidators([Validators.required]);
        appSizeCtrl.setValidators([Validators.required]);
      } else if (roomType === 'supply') {
        supMeasureCtrl.setValidators([Validators.required]);
      } else {
        // General or default
        genTypeCtrl.setValidators([Validators.required]);
      }
    }

    otherNameCtrl.updateValueAndValidity();
    appLevelCtrl.updateValueAndValidity();
    appTypeCtrl.updateValueAndValidity();
    appForCtrl.updateValueAndValidity();
    appSizeCtrl.updateValueAndValidity();
    supMeasureCtrl.updateValueAndValidity();
    genTypeCtrl.updateValueAndValidity();
    genSizeCtrl.updateValueAndValidity();
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
      quantity: Number(v.quantity),
      note: v.note || null
    };

    if (v.itemId === 'other') {
      payload.itemId = null;
      payload.otherItemName = v.otherItemName;

      // Build details object based on room type
      const details: any = {};

      if (this.selectedRoomType === 'apparel') {
        details.apparelLevel = v.apparelLevel;
        details.apparelType = v.apparelType;
        details.apparelFor = v.apparelFor;
        details.apparelSize = v.apparelSize;
      } else if (this.selectedRoomType === 'supply') {
        details.supplyMeasure = v.supplyMeasure;
      } else {
        details.genItemType = v.genItemType;
        details.genItemSize = v.genItemSize;
      }
      payload.details = details;

    } else {
      payload.itemId = Number(v.itemId);
    }

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