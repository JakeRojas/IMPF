import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
  lastResult: string | null = null;
  lastParsed: any = null;
  errorMsg: string | null = null;

  // batch-release UI state
  showBatchQtyInput = false;
  batchQty = 1;
  batchRoomIdInput: number | null = null; // used if payload lacks roomId

  constructor(
    private qrService: QrService,
    private roomService: RoomService,
    private alert: AlertService
  ) {}

  async ngAfterViewInit() {
    await this.startScanner();
  }

  async startScanner() {
    this.errorMsg = null;
    try {
      this.scanning = true;
      await this.codeReader.decodeFromVideoDevice(null, this.videoRef.nativeElement, (result, err) => {
        if (result) {
          this.lastResult = result.getText();
          try { this.lastParsed = JSON.parse(this.lastResult); } catch (e) { this.lastParsed = null; }
          // stop scanning after a result
          this.stopScanner();
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
  }

  ngOnDestroy() {
    this.stopScanner();
  }
  onReleaseClicked() {
    if (!this.lastParsed && !this.lastResult) {
      this.alert.error('No scanned payload available.');
      return;
    }

    const payload = this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };

    // unit-level QR detection: uses unitId in your payload builder.
    if (payload.unitId) {
      this.releaseUnit(payload);
      return;
    }

    // batch-level QR detection: presence of id/inventoryId/apparelInventoryId
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    if (inventoryId) {
      // If payload includes roomId we can proceed to qty input immediately
      if (payload.roomId) {
        this.batchRoomIdInput = payload.roomId;
      } else {
        this.batchRoomIdInput = null; // will prompt user
      }
      // show inline qty UI
      this.showBatchQtyInput = true;
      this.batchQty = 1;
      return;
    }

    // unknown payload — fallback: show error
    this.alert.error('Scanned QR is not a recognizable unit or batch payload.');
  }

  private releaseUnit(payload: any) {
    const stockroomType = payload.itemType || 'apparel';
    const unitId = payload.unitId;
    if (!unitId) { this.alert.error('Unit ID not found in QR payload.'); return; }

    // call the QR-specific release endpoint (doesn't require room id)
    this.qrService.releaseUnit(stockroomType, unitId, { actorId: undefined }).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Unit released');
        this.resetAfterRelease();
      },
      error: (e) => this.alert.error(e)
    });
  }

  confirmBatchRelease() {
    if (!this.lastParsed && !this.lastResult) {
      this.alert.error('No scanned payload available.');
      return;
    }
    const payload = this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    if (!inventoryId) { this.alert.error('Inventory id not found in QR payload.'); return; }

    const roomId = payload.roomId || this.batchRoomIdInput;
    if (!roomId) { this.alert.error('Room ID required for batch release.'); return; }

    const qty = Number(this.batchQty || 0);
    if (!Number.isInteger(qty) || qty <= 0) { this.alert.error('Please enter a valid quantity to release.'); return; }

    const releasePayload: any = {
      apparelInventoryId: inventoryId,
      releaseQuantity: qty,
      releasedBy: 'QR-Scanner', // swap with real user if available
      notes: `Released via QR on ${new Date().toISOString()}`
    };

    // call the room service and SUBSCRIBE (very important)
    this.roomService.releaseApparel(Number(roomId), releasePayload).pipe(first()).subscribe({
      next: (res: any) => {
        this.alert.success('Batch released successfully.');
        // reset UI and restart scanner
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

  private resetAfterRelease() {
    this.lastResult = null;
    this.lastParsed = null;
    this.showBatchQtyInput = false;
    this.batchQty = 1;
    this.batchRoomIdInput = null;
    // optionally restart scanner
    this.startScanner();
  }
}

/** small helper */
function tryParseJson(s: any) {
  try { return JSON.parse(s); } catch (e) { return null; }
}