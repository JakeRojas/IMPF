import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { BrowserQRCodeReader } from '@zxing/library';
import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { QrService, RoomService, AlertService, AccountService, StockRequestService, TransferService } from '@app/_services';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.scss']
})
export class ScanComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  private codeReader = new BrowserQRCodeReader();
  scanning = false;
  lastResult: string | null = null;        // raw scanned text
  lastParsed: any = null;                 // parsed JSON (if any)
  lastScannedItem: any = null;            // enriched object returned by backend
  errorMsg: string | null = null;

  // batch-release UI state
  showBatchQtyInput = false;
  batchQty = 1;
  batchRoomIdInput: number | null = null;
  batchActionType: 'release' | 'receive' = 'release';
  claimedBy = '';
  releasedBy = '';
  rooms: any[] = [];

  // stock-request UI state
  showStockRequestForm = false;
  stockRequestData: any = {
    requesterRoomId: '',
    quantity: 1,
    note: ''
  };

  // transfer UI state
  showTransferForm = false;
  transferData: any = {
    fromRoomId: '',
    toRoomId: '',
    quantity: 1,
    note: ''
  };

  // update-status UI state
  openUpdateMenu = false;
  updating = false;
  statuses: string[] = ['in_stock', 'active', 'released', 'lost', 'damaged', 'repair'];

  constructor(
    private qrService: QrService,
    private roomService: RoomService,
    private alert: AlertService,
    private cd: ChangeDetectorRef,
    private http: HttpClient,
    private accountService: AccountService,
    private stockRequestService: StockRequestService,
    private transferService: TransferService
  ) {
    this.roomService.getRooms().pipe(first()).subscribe(rooms => this.rooms = rooms);
    const user = this.accountService.accountValue;
    if (user) {
      this.releasedBy = `${user.firstName} ${user.lastName}`;
    }
  }

  async ngAfterViewInit() {
    // start after initial detection
    setTimeout(() => this.startScanner(), 0);
  }

  async startScanner() {
    this.errorMsg = null;
    try {
      this.scanning = true;
      // decodeFromVideoDevice calls our callback each time a result or error occurs
      await this.codeReader.decodeFromVideoDevice(null, this.videoRef.nativeElement, (result, err) => {
        if (result) {
          this.lastResult = result.getText();
          this.lastParsed = tryParseJson(this.lastResult);
          // stop live scanning and fetch canonical/enriched data from backend
          this.stopScanner();
          this.fetchScannedDetails(this.lastResult);
        }
      });
    } catch (err: any) {
      this.errorMsg = err?.message || String(err);
      this.scanning = false;
    }
  }

  stopScanner() {
    try { this.codeReader.reset(); } catch (e) { }
    this.scanning = false;
    this.cd.detectChanges();
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  // New: ask backend to verify the scanned text and return canonical item/unit/inventory
  fetchScannedDetails(qrText: string) {
    this.lastScannedItem = null;
    this.errorMsg = null;
    if (!qrText) { this.errorMsg = 'Empty QR payload'; return; }

    // match backend API signature: verifyQr expects payload object (qrId)
    this.qrService.verifyQr({ qrId: qrText }).pipe(first()).subscribe({
      next: (res: any) => {
        // backend returns { item } — but some implementations might return item directly
        this.lastScannedItem = res?.item || res;
        // keep parsed JSON handy
        this.lastParsed = this.lastParsed || tryParseJson(this.lastResult);
        this.cd.detectChanges();
      },
      error: (err: any) => {
        this.lastScannedItem = null;
        this.errorMsg = err?.error?.message || err?.message || 'Item not found';
        this.cd.detectChanges();
      }
    });
  }

  // Keep Release logic but prefer lastScannedItem for canonical fields
  onReleaseClicked() {
    const payload = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };

    if (this.isUnit()) {
      const claimedBy = prompt('Enter the name of the person claiming this item:');
      if (!claimedBy) return;
      this.releaseUnit(payload, claimedBy);
      return;
    }

    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    if (inventoryId) {
      this.batchRoomIdInput = payload.roomId || null;
      this.batchActionType = 'release';
      this.showBatchQtyInput = true;
      this.batchQty = 1;
      this.cd.detectChanges();
      return;
    }

    this.alert.error('Scanned QR is not a recognizable unit or batch payload.');
  }

  onReceiveClicked() {
    const payload = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };

    // unit-level QR => invoking receiveUnit isn't typical; prefer batch-level
    if (this.isUnit()) {
      // fallback: ask user to use receive form or implement unit-level receive if you want
      this.alert.error('Unit-level receive is not supported via QR. Scan a batch QR (inventory) instead.');
      return;
    }

    // batch-level QR (inventory id)
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    if (inventoryId) {
      this.batchRoomIdInput = payload.roomId || null;
      this.batchActionType = 'receive';
      this.showBatchQtyInput = true;
      this.batchQty = 1;
      return;
    }

    this.alert.error('Scanned QR is not a recognizable batch payload.');
  }

  onStockRequestClicked() {
    const payload = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;

    if (!inventoryId) {
      this.alert.error('Inventory id not found in scanned QR payload.');
      return;
    }

    this.stockRequestData = {
      requesterRoomId: payload.roomId || '',
      quantity: 1,
      note: ''
    };
    this.showStockRequestForm = true;
  }

  confirmStockRequest() {
    const payload = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    const itemType = this.extractItemType();

    if (!this.stockRequestData.requesterRoomId) { this.alert.error('Requester Room is required.'); return; }
    if (!this.stockRequestData.quantity || this.stockRequestData.quantity < 1) { this.alert.error('Valid quantity is required.'); return; }

    const body = {
      requesterRoomId: Number(this.stockRequestData.requesterRoomId),
      itemId: Number(inventoryId),
      quantity: Number(this.stockRequestData.quantity),
      note: this.stockRequestData.note
    };

    this.stockRequestService.create(body).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Stock request created successfully');
        this.resetAfterAction();
        setTimeout(() => this.startScanner(), 300);
      },
      error: (err) => {
        const msg = (err?.error?.message || err?.message || String(err));
        this.alert.error(`Failed to create stock request: ${msg}`);
      }
    });
  }

  cancelStockRequest() {
    this.showStockRequestForm = false;
  }

  onTransferClicked() {
    const payload = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;

    if (!inventoryId) {
      this.alert.error('Inventory id not found in scanned QR payload.');
      return;
    }

    this.transferData = {
      fromRoomId: payload.roomId || '',
      toRoomId: '',
      quantity: 1,
      note: ''
    };
    this.showTransferForm = true;
  }

  confirmTransfer() {
    const payload = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    const itemType = this.extractItemType();

    if (!this.transferData.fromRoomId) { this.alert.error('From Room is required.'); return; }
    if (!this.transferData.toRoomId) { this.alert.error('To Room is required.'); return; }
    if (this.transferData.fromRoomId === this.transferData.toRoomId) { this.alert.error('From and To rooms must be different.'); return; }
    if (!this.transferData.quantity || this.transferData.quantity < 1) { this.alert.error('Valid quantity is required.'); return; }

    const body = {
      fromRoomId: Number(this.transferData.fromRoomId),
      toRoomId: Number(this.transferData.toRoomId),
      itemId: Number(inventoryId),
      quantity: Number(this.transferData.quantity),
      note: this.transferData.note
    };

    this.transferService.create(body).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Transfer created successfully');
        this.resetAfterAction();
        setTimeout(() => this.startScanner(), 300);
      },
      error: (err) => {
        const msg = (err?.error?.message || err?.message || String(err));
        this.alert.error(`Failed to create transfer: ${msg}`);
      }
    });
  }

  cancelTransfer() {
    this.showTransferForm = false;
  }

  // duplicate releaseUnit removed


  confirmBatchAction() {
    const payload = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    if (!inventoryId) { this.alert.error('Inventory id not found in scanned QR payload.'); return; }
    const roomId = payload.roomId || this.batchRoomIdInput;
    if (!roomId) { this.alert.error('Room id required for batch operation.'); return; }

    const stockroomType = (payload.itemType || payload.stockroomType || this.lastScannedItem?._detectedItemType || 'apparel').toString().toLowerCase();

    // helper to get current user id (used as receivedBy). Tries multiple localStorage keys to match your app.
    const getCurrentUserId = (): number | null => {
      try {
        const raw = localStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('account');
        if (!raw) return null;
        const u = JSON.parse(raw);
        return (u?.id || u?.accountId || u?.userId || null) ? Number(u.id || u.accountId || u.userId) : null;
      } catch (e) { return null; }
    };

    const currentUserId = getCurrentUserId();
    if (this.batchActionType === 'release') {
      const releaseData = {
        claimedBy: this.claimedBy,
        releasedBy: this.releasedBy,
        quantity: Number(this.batchQty)
      };

      // -- existing release behavior (keeps your callbacks style) --
      if (stockroomType === 'apparel') {
        const body = {
          apparelInventoryId: Number(inventoryId),
          releaseApparelQuantity: releaseData.quantity,
          claimedBy: releaseData.claimedBy,
          releasedBy: releaseData.releasedBy
        };
        this.roomService.releaseApparel(Number(roomId), body).pipe(first()).subscribe({
          next: () => { this.alert.success('Released successfully'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
          error: (err) => { const msg = (err?.error?.message || err?.message || String(err)); this.alert.error(`Failed to release: ${msg}`); }
        });
        return;
      }

      if (['supply', 'admin-supply', 'adminsupply'].includes(stockroomType)) {
        const body = {
          adminSupplyInventoryId: Number(inventoryId),
          releaseAdminSupplyQuantity: releaseData.quantity,
          claimedBy: releaseData.claimedBy,
          releasedBy: releaseData.releasedBy
        };
        this.roomService.releaseAdminSupply(Number(roomId), body).pipe(first()).subscribe({
          next: () => { this.alert.success('Released successfully'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
          error: (err) => { const msg = (err?.error?.message || err?.message || String(err)); this.alert.error(`Failed to release: ${msg}`); }
        });
        return;
      }

      // fallback -> genitem / general
      const body = {
        genItemInventoryId: Number(inventoryId),
        releaseGenItemQuantity: releaseData.quantity,
        claimedBy: releaseData.claimedBy,
        releasedBy: releaseData.releasedBy
      };
      this.roomService.releaseGenItem(Number(roomId), body).pipe(first()).subscribe({
        next: () => { this.alert.success('Released successfully'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
        error: (err) => { const msg = (err?.error?.message || err?.message || String(err)); this.alert.error(`Failed to release: ${msg}`); }
      });
      return;
    }

    // === receive path ===
    // Build a receive payload using the canonical fields from lastScannedItem.inventory when present,
    // otherwise fall back to scanned payload fields.
    const inv = this.lastScannedItem?.inventory || this.lastScannedItem?.batch || this.lastScannedItem || payload;

    // Apparel receive
    if (stockroomType === 'apparel') {
      const body: any = {
        apparelName: inv.apparelName || inv.name || payload.apparelName || payload.name || '',
        apparelLevel: inv.apparelLevel || payload.apparelLevel || '',
        apparelType: inv.apparelType || payload.apparelType || '',
        apparelFor: inv.apparelFor || payload.apparelFor || '',
        apparelSize: inv.apparelSize || inv.size || payload.apparelSize || payload.size || '',
        apparelQuantity: Number(this.batchQty),
        receivedFrom: `QR:${(this.lastResult || '').slice(0, 40)}`,
        receivedBy: currentUserId ?? 1,
        notes: payload.notes || null
      };

      if (!body.apparelName) { this.alert.error('Apparel name not found in QR payload'); return; }

      this.roomService.receiveItem(Number(roomId), body).pipe(first()).subscribe({
        next: () => { this.alert.success('Received apparel batch'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
        error: (err) => { const msg = (err?.error?.message || err?.message || String(err)); this.alert.error(`Failed to receive: ${msg}`); }
      });
      return;
    }

    // Admin supply receive
    if (['supply', 'admin-supply', 'adminsupply'].includes(stockroomType)) {
      const body: any = {
        supplyName: inv.supplyName || inv.name || payload.supplyName || payload.name || '',
        supplyMeasure: inv.supplyMeasure || payload.supplyMeasure || payload.measure || 'pcs',
        supplyQuantity: Number(this.batchQty),
        receivedFrom: `QR:${(this.lastResult || '').slice(0, 40)}`,
        receivedBy: currentUserId ?? 1,
        notes: payload.notes || null
      };

      if (!body.supplyName) { this.alert.error('Supply name not found in QR payload'); return; }

      this.roomService.receiveItem(Number(roomId), body).pipe(first()).subscribe({
        next: () => { this.alert.success('Received admin supply batch'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
        error: (err) => { const msg = (err?.error?.message || err?.message || String(err)); this.alert.error(`Failed to receive: ${msg}`); }
      });
      return;
    }

    // Gen item receive (fallback)
    const body: any = {
      genItemName: inv.genItemName || inv.name || payload.genItemName || payload.name || 'unknown',
      genItemSize: inv.genItemSize || inv.size || payload.genItemSize || payload.size || '',
      genItemQuantity: Number(this.batchQty),
      genItemType: (inv.genItemType || payload.genItemType || 'unknownType').toString(),
      receivedFrom: `QR:${(this.lastResult || '').slice(0, 40)}`,
      receivedBy: currentUserId ?? 1,
      notes: payload.notes || null
    };

    // ensure genItemType is one of your allowed values ('it','maintenance','unknownType')
    const t = (body.genItemType || '').toLowerCase();
    body.genItemType = (t === 'it' || t === 'maintenance') ? t : 'unknownType';

    this.roomService.receiveItem(Number(roomId), body).pipe(first()).subscribe({
      next: () => { this.alert.success('Received general item batch'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
      error: (err) => { const msg = (err?.error?.message || err?.message || String(err)); this.alert.error(`Failed to receive: ${msg}`); }
    });
  }

  cancelBatchAction() {
    this.showBatchQtyInput = false;
    this.batchQty = 1;
    this.batchRoomIdInput = null;
  }

  resetAfterAction() {
    this.lastResult = null;
    this.lastParsed = null;
    this.lastScannedItem = null;
    this.showBatchQtyInput = false;
    this.showStockRequestForm = false;
    this.showTransferForm = false;
    this.batchQty = 1;
    this.batchRoomIdInput = null;
    this.openUpdateMenu = false;
    this.updating = false;
    this.cd.detectChanges();
  }

  // New user action: restart scanning without leaving the view
  scanAgain() {
    this.resetAfterAction();
    setTimeout(() => this.startScanner(), 100);
  }

  // Friendly quantity extractor (defensive: many possible shapes)
  getDisplayedQuantity(): number | string {
    const it = this.lastScannedItem;
    if (!it) return '-';

    // If backend returned a "unit" with a parent inventory
    const unit = it.unit || (it.payload && it.payload.unit) || null;
    const inv = it.inventory || it.batch || it.inventoryRecord || null;

    const cand = [
      unit?.totalQuantity, unit?.quantity, unit?.qty,
      inv?.totalQuantity, inv?.quantity, inv?.qty,
      it?.totalQuantity, it?.quantity, it?.qty
    ];
    for (const c of cand) if (c !== undefined && c !== null) return c;
    return '-';
  }

  // helpers used by update/status UI
  extractUnitId() {
    const unit = this.lastScannedItem?.unit || this.lastScannedItem?.payload?.unit;
    return unit?.genItemId || unit?.adminSupplyId || unit?.apparelId || unit?.id ||
      this.lastScannedItem?.payload?.unitId ||
      this.lastParsed?.unitId ||
      this.lastScannedItem?.unitId ||
      null;
  }

  extractItemType() {
    const payload = this.lastScannedItem?.payload || this.lastParsed || {};
    const unit = this.lastScannedItem?.unit || payload.unit || {};

    // check possible type fields
    const cand = [
      payload.stockroomType,
      payload.itemType,
      payload.type,
      payload._detectedItemType, // Backend detection!
      unit.itemType,
      unit.genItemType, // Canonical GenItem type!
      unit.type,
      this.lastScannedItem?.type,
      this._detectedItemTypeFromPayload(payload)
    ];

    for (const c of cand) {
      if (c) return String(c).toLowerCase();
    }

    return 'apparel'; // default to apparel
  }

  private _detectedItemTypeFromPayload(p: any): string | null {
    if (!p) return null;
    if (p.unitId || p.inventoryId) {
      if (p.apparelId || p.apparelInventoryId || p.apparelName) return 'apparel';
      if (p.adminSupplyId || p.adminSupplyInventoryId || p.supplyName) return 'supply';
      if (p.genItemId || p.genItemInventoryId || p.genItemName) return 'genitem';
    }
    return null;
  }

  extractRoomId() {
    return this.lastScannedItem?.unit?.roomId ||
      this.lastScannedItem?.payload?.roomId ||
      this.lastScannedItem?.roomId ||
      this.lastParsed?.roomId ||
      this.lastScannedItem?.inventory?.roomId ||
      null;
  }

  extractSku() {
    return this.lastScannedItem?.payload?.sku ||
      this.lastScannedItem?.sku ||
      this.lastScannedItem?.inventory?.sku ||
      this.lastParsed?.sku ||
      '-';
  }

  isUnit(): boolean {
    // lastScannedItem.unit exists or parsed payload has unitId
    const payload = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult);
    return !!(this.lastScannedItem?.unit || payload?.unitId || this.extractUnitId());
  }

  onWorkingClicked() {
    const unitId = this.extractUnitId();
    if (!unitId) { this.alert.error('Unit id not found in QR payload.'); return; }

    const stockroomType = (this.extractItemType() || 'apparel').toString().toLowerCase();
    const roomId = this.extractRoomId() || this.batchRoomIdInput || null;

    // If we're scanning an apparel unit and we have a room context, use roomService
    if (stockroomType === 'apparel' && roomId) {
      this.roomService.updateApparelUnit(Number(roomId), Number(unitId), { status: 'working' }).pipe(first()).subscribe({
        next: (updated: any) => { this.alert.success('Unit marked as working'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
        error: (err: any) => { this.alert.error(err?.error?.message || err?.message || 'Failed to update status'); }
      });
      return;
    }

    // fallback: use generic QR endpoint for other types or when no roomId
    this.qrService.updateUnitStatus(stockroomType, Number(unitId), { status: 'working' }).pipe(first()).subscribe({
      next: () => { this.alert.success('Unit marked as working'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
      error: (err: any) => { this.alert.error(err?.error?.message || err?.message || 'Failed to update status'); }
    });
  }

  // replace the existing onDamageClicked() in src/app/scan/scan.component.ts with this:
  onDamageClicked() {
    const unitId = this.extractUnitId();
    if (!unitId) { this.alert.error('Unit id not found in QR payload.'); return; }

    const stockroomType = (this.extractItemType() || 'apparel').toString().toLowerCase();
    const roomId = this.extractRoomId() || this.batchRoomIdInput || null;

    // NOTE: apparel model uses 'damage' as the enum value (not 'damaged'), so map it when using roomService.
    // Use the room-scoped update when roomId exists.
    if (stockroomType === 'apparel' && roomId) {
      this.roomService.updateApparelUnit(Number(roomId), Number(unitId), { status: 'damage' }).pipe(first()).subscribe({
        next: (updated: any) => { this.alert.success('Unit marked as damaged'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
        error: (err: any) => { this.alert.error(err?.error?.message || err?.message || 'Failed to update status'); }
      });
      return;
    }

    // fallback: use generic QR endpoint (keeps existing behavior)
    this.qrService.updateUnitStatus(stockroomType, Number(unitId), { status: 'damaged' }).pipe(first()).subscribe({
      next: () => { this.alert.success('Unit marked as damaged'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
      error: (err: any) => { this.alert.error(err?.error?.message || err?.message || 'Failed to update status'); }
    });
  }

  // Updated Release Unit to use extractors
  private releaseUnit(payload: any, claimedBy: string) {
    const unitId = this.extractUnitId();
    if (!unitId) { this.alert.error('Unit ID not found in QR payload.'); return; }

    const stockroomType = (this.extractItemType() || 'apparel').toString().toLowerCase();
    const roomId = this.extractRoomId() || this.batchRoomIdInput || this.lastScannedItem?.unit?.roomId || null;

    const user = this.accountService.accountValue;
    const releasePayload: any = {
      unitId: Number(unitId),
      claimedBy: claimedBy,
      releasedBy: user ? `${user.firstName} ${user.lastName}` : 'Scanner User',
      releaseQuantity: 1
    };

    // If we have inventory ID from scanned item, include it
    const inventoryId = this.lastScannedItem?.unit?.apparelInventoryId ||
      this.lastScannedItem?.unit?.adminSupplyInventoryId ||
      this.lastScannedItem?.unit?.genItemInventoryId ||
      payload.apparelInventoryId || payload.adminSupplyInventoryId || payload.genItemInventoryId ||
      payload.inventoryId || payload.id ||
      payload.batchId; // QR payloads use batchId!

    if (inventoryId) {
      if (stockroomType === 'apparel') releasePayload.apparelInventoryId = inventoryId;
      if (['supply', 'admin-supply', 'adminsupply'].includes(stockroomType)) releasePayload.adminSupplyInventoryId = inventoryId;
      if (['genitem', 'general', 'it', 'maintenance'].includes(stockroomType)) releasePayload.genItemInventoryId = inventoryId;
    }

    // prefer roomService when roomId exists (handles inventory decrement and unit destruction)
    if (roomId) {
      let obs: Observable<any>;
      if (stockroomType === 'apparel') {
        releasePayload.releaseApparelQuantity = 1;
        obs = this.roomService.releaseApparel(Number(roomId), releasePayload);
      } else if (['supply', 'admin-supply', 'adminsupply'].includes(stockroomType)) {
        releasePayload.releaseAdminSupplyQuantity = 1;
        obs = this.roomService.releaseAdminSupply(Number(roomId), releasePayload);
      } else {
        releasePayload.releaseItemQuantity = 1;
        // Normalize genItemType for backend ENUM ('it', 'maintenance', 'unknownType')
        const rawType = (this.lastScannedItem?.unit?.genItemType || stockroomType || '').toLowerCase();
        releasePayload.genItemType = ['it', 'maintenance'].includes(rawType) ? rawType : 'unknownType';
        obs = this.roomService.releaseGenItem(Number(roomId), releasePayload);
      }

      obs.pipe(first()).subscribe({
        next: () => { this.alert.success('Unit released successfully.'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
        error: (err: any) => { this.alert.error(err?.error?.message || err?.message || String(err)); }
      });
      return;
    }

    // otherwise call qrService.releaseUnit (fallback)
    this.qrService.releaseUnit(stockroomType, Number(unitId), { actorId: user?.AccountId, claimedBy }).pipe(first()).subscribe({
      next: () => { this.alert.success('Unit released successfully.'); this.resetAfterAction(); setTimeout(() => this.startScanner(), 300); },
      error: (err: any) => { this.alert.error(err?.error?.message || err?.message || String(err)); }
    });
  }
}

/** small helper (kept from original file) */
function tryParseJson(s: any) {
  try { return JSON.parse(s); } catch (e) { return null; }
}