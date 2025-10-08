import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef  } from '@angular/core';
import { BrowserQRCodeReader } from '@zxing/library';
import { first } from 'rxjs/operators';

import { QrService, RoomService, AlertService } from '@app/_services';

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

  // update-status UI state
  openUpdateMenu = false;
  updating = false;
  statuses: string[] = ['in_stock', 'active', 'released', 'lost', 'damaged', 'repair'];

  constructor(
    private qrService: QrService,
    private roomService: RoomService,
    private alert: AlertService,
    private cd: ChangeDetectorRef
  ) {}

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
    try { this.codeReader.reset(); } catch (e) {}
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

    // unit-level QR
    if (payload.unitId) {
      this.releaseUnit(payload);
      return;
    }

    // batch-level QR (inventory id)
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    if (inventoryId) {
      this.batchRoomIdInput = payload.roomId || null;
      this.showBatchQtyInput = true;
      this.batchQty = 1;
      return;
    }

    this.alert.error('Scanned QR is not a recognizable unit or batch payload.');
  }

  // existing releaseUnit kept (uses roomService or qrService as before)
  private releaseUnit(payload: any) {
    const stockroomType = payload.itemType || 'apparel';
    const unitId = payload.unitId;
    if (!unitId) { this.alert.error('Unit ID not found in QR payload.'); return; }

    // prefer roomService call when roomId exists
    const roomId = payload.roomId || this.batchRoomIdInput || null;
    if (stockroomType === 'apparel' && roomId) {
      const roomIdNum = Number(roomId);
      const releasePayload = { unitId: Number(unitId) };
      this.roomService.releaseApparel(Number(roomIdNum), releasePayload).pipe(first()).subscribe({
        next: () => { this.alert.success('Unit released successfully.'); this.resetAfterRelease(); setTimeout(()=>this.startScanner(), 300); },
        error: (err) => { const msg = err?.error?.message || err?.message || String(err); this.alert.error(`Failed to release: ${msg}`); }
      });
      return;
    }

    // fallback to qrService.releaseUnit (if implemented)
    if (typeof this.qrService.releaseUnit === 'function') {
      this.qrService.releaseUnit(stockroomType, unitId).pipe(first()).subscribe({
        next: () => { this.alert.success('Unit released successfully.'); this.resetAfterRelease(); setTimeout(()=>this.startScanner(), 300); },
        error: (err) => { const msg = err?.error?.message || err?.message || String(err); this.alert.error(`Failed to release: ${msg}`); }
      });
      return;
    }

    this.alert.error('Release not implemented for this payload (adapt releaseUnit to call your API).');
  }

  confirmBatchRelease() {
    if (!this.lastParsed && !this.lastResult) {
      this.alert.error('No scanned payload available.');
      return;
    }
  
    const payload = this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
  
    // prefer the inventory id names used across backend
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    if (!inventoryId) {
      this.alert.error('Inventory id not found in scanned QR payload.');
      return;
    }
  
    const roomId = payload.roomId || this.batchRoomIdInput;
    if (!roomId) {
      this.alert.error('Room id required for batch release.');
      return;
    }
  
    // Build payload with the exact field names backend expects
    const releasePayload: any = {
      apparelInventoryId: Number(inventoryId),
      releaseApparelQuantity: Number(this.batchQty)
    };
  
    // Call the room service (subscribe is important)
    this.roomService.releaseApparel(Number(roomId), releasePayload).pipe(first()).subscribe({
      next: (res: any) => {
        this.alert.success('Batch released successfully.');
        this.resetAfterRelease();
        // Restart scanning after a short delay so camera restarts cleanly
        setTimeout(() => this.startScanner(), 300);
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || String(err);
        this.alert.error(`Failed to release: ${msg}`);
      }
    });
  }

  cancelBatchRelease() {
    this.showBatchQtyInput = false;
    this.batchQty = 1;
    this.batchRoomIdInput = null;
  }

  resetAfterRelease() {
    this.lastResult = null;
    this.lastParsed = null;
    this.lastScannedItem = null;
    this.showBatchQtyInput = false;
    this.batchQty = 1;
    this.batchRoomIdInput = null;
    this.openUpdateMenu = false;
    this.updating = false;
    this.cd.detectChanges();
  }

  // New user action: restart scanning without leaving the view
  scanAgain() {
    this.resetAfterRelease();
    setTimeout(()=> this.startScanner(), 100);
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

  // helpers used by update/status UI (left unchanged)
  extractUnitId() {
    const p = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult);
    return p?.unitId || null;
  }
  extractItemType() {
    const p = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult);
    return p?.itemType || p?.type || null;
  }
  extractRoomId() {
    const p = this.lastScannedItem?.payload || this.lastParsed || tryParseJson(this.lastResult);
    return p?.roomId || null;
  }
}

/** small helper (kept from original file) */
function tryParseJson(s: any) {
  try { return JSON.parse(s); } catch (e) { return null; }
}