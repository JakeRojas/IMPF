// import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
// import { BrowserQRCodeReader } from '@zxing/library';
// import { first } from 'rxjs/operators';

// import { QrService, RoomService, AlertService } from '@app/_services';


// @Component({
//   selector: 'app-scan',
//   templateUrl: './scan.component.html',
//   styleUrls: ['./scan.component.scss']
// })
// export class ScanComponent implements AfterViewInit, OnDestroy {
//   @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

//   private codeReader = new BrowserQRCodeReader();
//   scanning = false;
//   lastResult: string | null = null;
//   lastParsed: any = null;
//   errorMsg: string | null = null;

//   // batch-release UI state
//   showBatchQtyInput = false;
//   batchQty = 1;
//   batchRoomIdInput: number | null = null; // used if payload lacks roomId

//   constructor(
//     private qrService: QrService,
//     private roomService: RoomService,
//     private alert: AlertService
//   ) {}

//   async ngAfterViewInit() {
//     await this.startScanner();
//   }

//   async startScanner() {
//     this.errorMsg = null;
//     try {
//       this.scanning = true;
//       await this.codeReader.decodeFromVideoDevice(null, this.videoRef.nativeElement, (result, err) => {
//         if (result) {
//           this.lastResult = result.getText();
//           try { this.lastParsed = JSON.parse(this.lastResult); } catch (e) { this.lastParsed = null; }
//           // stop scanning after a result
//           this.stopScanner();
//         }
//       });
//     } catch (err: any) {
//       this.errorMsg = err?.message || String(err);
//       this.scanning = false;
//     }
//   }

//   stopScanner() {
//     try { this.codeReader.reset(); } catch (e) {}
//     this.scanning = false;
//   }

//   ngOnDestroy() {
//     this.stopScanner();
//   }
//   onReleaseClicked() {
//     if (!this.lastParsed && !this.lastResult) {
//       this.alert.error('No scanned payload available.');
//       return;
//     }

//     const payload = this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };

//     // unit-level QR detection: uses unitId in your payload builder.
//     if (payload.unitId) {
//       this.releaseUnit(payload);
//       return;
//     }

//     // batch-level QR detection: presence of id/inventoryId/apparelInventoryId
//     const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
//     if (inventoryId) {
//       // If payload includes roomId we can proceed to qty input immediately
//       if (payload.roomId) {
//         this.batchRoomIdInput = payload.roomId;
//       } else {
//         this.batchRoomIdInput = null; // will prompt user
//       }
//       // show inline qty UI
//       this.showBatchQtyInput = true;
//       this.batchQty = 1;
//       return;
//     }

//     // unknown payload — fallback: show error
//     this.alert.error('Scanned QR is not a recognizable unit or batch payload.');
//   }

//   private releaseUnit(payload: any) {
//     const stockroomType = payload.itemType || 'apparel';
//     const unitId = payload.unitId;
//     if (!unitId) { this.alert.error('Unit ID not found in QR payload.'); return; }

//     // call the QR-specific release endpoint (doesn't require room id)
//     this.qrService.releaseUnit(stockroomType, unitId, { actorId: undefined }).pipe(first()).subscribe({
//       next: () => {
//         this.alert.success('Unit released');
//         this.resetAfterRelease();
//       },
//       error: (e) => this.alert.error(e)
//     });
//   }

//   confirmBatchRelease() {
//     if (!this.lastParsed && !this.lastResult) {
//       this.alert.error('No scanned payload available.');
//       return;
//     }
//     const payload = this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
//     const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
//     if (!inventoryId) { this.alert.error('Inventory id not found in QR payload.'); return; }

//     const roomId = payload.roomId || this.batchRoomIdInput;
//     if (!roomId) { this.alert.error('Room ID required for batch release.'); return; }

//     const qty = Number(this.batchQty || 0);
//     if (!Number.isInteger(qty) || qty <= 0) { this.alert.error('Please enter a valid quantity to release.'); return; }

//     const releasePayload: any = {
//       apparelInventoryId: inventoryId,
//       releaseQuantity: qty,
//       releasedBy: 'QR-Scanner', // swap with real user if available
//       notes: `Released via QR on ${new Date().toISOString()}`
//     };

//     // call the room service and SUBSCRIBE (very important)
//     this.roomService.releaseApparel(Number(roomId), releasePayload).pipe(first()).subscribe({
//       next: (res: any) => {
//         this.alert.success('Batch released successfully.');
//         // reset UI and restart scanner
//         this.resetAfterRelease();
//         // Restart scanning after a short delay so camera restarts cleanly
//         setTimeout(() => this.startScanner(), 300);
//       },
//       error: (err: any) => {
//         const msg = err?.error?.message || err?.message || String(err);
//         this.alert.error(`Failed to release: ${msg}`);
//       }
//     });
//   }

//   cancelBatchRelease() {
//     this.showBatchQtyInput = false;
//     this.batchQty = 1;
//     this.batchRoomIdInput = null;
//   }

//   private resetAfterRelease() {
//     this.lastResult = null;
//     this.lastParsed = null;
//     this.showBatchQtyInput = false;
//     this.batchQty = 1;
//     this.batchRoomIdInput = null;
//     // optionally restart scanner
//     this.startScanner();
//   }

//   // updateScannedStatus() {
//   //   if (!this.lastParsed && !this.lastResult) {
//   //     this.alert.error('No scanned payload available.');
//   //     return;
//   //   }
  
//   //   const payload = this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
  
//   //   // must be unit-level payload
//   //   const unitId = payload.unitId;
//   //   if (!unitId) {
//   //     this.alert.error('Scanned QR is not a unit QR (no unitId found).');
//   //     return;
//   //   }
  
//   //   const stockroomType = payload.itemType || 'apparel';
  
//   //   // simple prompt UI — change to modal/select if you want richer UI
//   //   const suggested = payload.status || 'damage';
//   //   const newStatus = window.prompt('Enter new status for the unit (e.g. goods, damage, in_stock, lost):', suggested);
//   //   if (!newStatus) return; // user cancelled
  
//   //   this.qrService.updateUnitStatus(stockroomType, unitId, { status: newStatus }).pipe(first()).subscribe({
//   //     next: () => {
//   //       this.alert.success(`Status updated to "${newStatus}"`);
//   //       // reset or keep lastParsed depending on desired flow; here we reset & restart scanner
//   //       this.resetAfterRelease();
//   //     },
//   //     error: (e) => {
//   //       const msg = e?.error?.message || e?.message || String(e);
//   //       this.alert.error(`Failed to update status: ${msg}`);
//   //     }
//   //   });
//   // }
//   updateScannedStatus() {
//     if (!this.lastParsed && !this.lastResult) {
//       this.alert.error('No scanned payload available.');
//       return;
//     }
  
//     const payload = this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
//     const unitId = payload.unitId || payload.id || payload.apparelId;
//     if (!unitId) {
//       this.alert.error('Scanned QR is not a unit QR (no unitId found).');
//       return;
//     }
  
//     const stockroomType = payload.itemType || 'apparel';
//     const suggested = payload.status || 'in_stock';
//     const newStatus = window.prompt('Enter new status for the unit (e.g. in_stock, damage, lost):', suggested);
//     if (!newStatus) return;
  
//     console.log('[Scan] updating unit status', { stockroomType, unitId, newStatus });
  
//     // call service
//     this.qrService.updateUnitStatus(stockroomType, unitId, { status: newStatus }).pipe(first()).subscribe({
//       next: (res) => {
//         console.log('[Scan] updateUnitStatus response', res);
//         this.alert.success(`Status updated to "${newStatus}"`);
//         this.resetAfterRelease(); // or refresh UI
//       },
//       error: (err) => {
//         console.error('[Scan] updateUnitStatus error', err);
//         const msg = err?.error?.message || err?.message || JSON.stringify(err);
//         this.alert.error(`Failed to update status: ${msg}`);
//       }
//     });
//   }
// }

// /** small helper */
// function tryParseJson(s: any) {
//   try { return JSON.parse(s); } catch (e) { return null; }
// }

import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener, ChangeDetectorRef  } from '@angular/core';
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

  // UPDATE-STATUS UI state (added)
  openUpdateMenu = false;
  updating = false;
  // statuses (adjust to your backend values if needed)
  statuses: string[] = ['in_stock', 'active', 'released', 'lost', 'damaged', 'repair'];

  constructor(
    private qrService: QrService,
    private roomService: RoomService,
    private alert: AlertService,
    private cd: ChangeDetectorRef
  ) {}

  // async ngAfterViewInit() {
  //   await this.startScanner();
  // }
  async ngAfterViewInit() {
    // Start the scanner *after* initial change detection to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      // ignore returned promise; startScanner handles errors internally
      this.startScanner();
    }, 0);
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
    this.cd.detectChanges();
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

    // If your backend requires roomId for release, prefer using payload.roomId or batchRoomIdInput
    const roomId = payload.roomId || this.batchRoomIdInput || null;

    if (stockroomType === 'apparel' && roomId) {
      const roomIdNum = Number(roomId);
      const releasePayload = { unitId: Number(unitId) };
      // call the room service and SUBSCRIBE (very important)
      this.roomService.releaseApparel(Number(roomIdNum), releasePayload).pipe(first()).subscribe({
        next: (res: any) => {
          this.alert.success('Unit released successfully.');
          // reset UI and restart scanner
          this.resetAfterRelease();
          this.cd.detectChanges();
          // Restart scanning after a short delay so camera restarts cleanly
          setTimeout(() => this.startScanner(), 300);
        },
        error: (err: any) => {
          const msg = err?.error?.message || err?.message || String(err);
          this.alert.error(`Failed to release: ${msg}`);
          this.cd.detectChanges();
        }
      });
      return;
    }

    // fallback: if you have a generic qrService.releaseUnit
    if (typeof this.qrService.releaseUnit === 'function') {
      this.qrService.releaseUnit(stockroomType, unitId).pipe(first()).subscribe({
        next: () => {
          this.alert.success('Unit released successfully.');
          this.resetAfterRelease();
          setTimeout(() => this.startScanner(), 300);
        },
        error: (err: any) => {
          const msg = err?.error?.message || err?.message || String(err);
          this.alert.error(`Failed to release: ${msg}`);
        }
      });
      return;
    }

    // no release implementation available
    this.alert.error('Release not implemented for this payload (adapt releaseUnit to call your API).');
  }

  // batch release confirm (keeps your original behavior)
  confirmBatchRelease() {
    if (!this.lastParsed && !this.lastResult) { this.alert.error('No scanned payload available.'); return; }

    const payload = this.lastParsed || tryParseJson(this.lastResult) || { raw: this.lastResult };
    const inventoryId = payload.id || payload.inventoryId || payload.apparelInventoryId;
    if (!inventoryId) { this.alert.error('Inventory id not found'); return; }

    const roomId = payload.roomId || this.batchRoomIdInput;
    if (!roomId) { this.alert.error('Room id required for batch release'); return; }

    const releasePayload = {
      inventoryId: inventoryId,
      qty: Number(this.batchQty)
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
    this.cd.detectChanges();
  }

  /***********************
   * UPDATE STATUS feature
   * Replaces the old prompt-based update. Adds Angular dropdown + API calls.
   ***********************/

  /** Toggle the update status menu (angular-driven) */
  toggleUpdateMenu(event?: Event) {
    if (event) event.stopPropagation();
    this.openUpdateMenu = !this.openUpdateMenu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(_: Event) {
    // close menu when clicking outside
    this.openUpdateMenu = false;
  }

  /** Try to extract a numeric unit id from the scanned payload or raw string. */
  private extractUnitId(): number | null {
    const p = this.lastParsed;
    if (!p && !this.lastResult) return null;

    const candidates = [
      p?.unitId, p?.id, p?.apparelId, p?.apparelUnitId,
      p?.adminSupplyUnitId, p?.genItemUnitId, p?.unit_id
    ];

    for (const c of candidates) {
      if (c !== undefined && c !== null && c !== '') return +c;
    }

    // try parse as plain number string
    if (!p && this.lastResult && /^\d+$/.test(this.lastResult)) return +this.lastResult;

    return null;
  }

  /** Get item type encoded in payload if present */
  private extractItemType(): string | null {
    const p = this.lastParsed;
    if (!p) return null;
    return p.itemType || p.type || p.stockroomType || p.kind || null;
  }

  /** Optional: room id encoded in QR payload */
  private extractRoomId(): number | null {
    const p = this.lastParsed;
    if (!p) return null;
    const r = p.roomId || p.room_id || p.room || null;
    return r ? +r : null;
  }

  /**
   * Called when user selects a status from the dropdown.
   * Uses roomService.updateApparelStatus(...) if itemType === 'apparel' and roomId exists,
   * otherwise falls back to qrService.updateUnitStatus(itemType, unitId, { status }).
   */
  updateScannedStatusTo(status: string) {
    const unitId = this.extractUnitId();
    if (!unitId) {
      this.alert.error('Scanned QR does not contain a unit id.');
      return;
    }

    const itemTypeRaw = this.extractItemType();
    const itemType = itemTypeRaw ? itemTypeRaw.toString() : 'apparel'; // default to apparel
    const roomId = this.extractRoomId();

    this.updating = true;
    // optional immediate UI feedback
    this.alert.success(`Updating status to "${status}"...`);

    // Preferred: if it's an apparel and roomId exists use the room-scoped endpoint
    if (itemType === 'apparel' && roomId) {
      this.roomService.updateApparelStatus(Number(roomId), Number(unitId), status).pipe(first()).subscribe({
        next: () => {
          this.updating = false;
          this.openUpdateMenu = false;
          this.alert.success(`Status set to "${status}"`);
          this.resetAfterRelease();
          this.cd.detectChanges();
        },
        error: (err) => {
          this.updating = false;
          this.openUpdateMenu = false;
          console.error('[Scan] updateApparelStatus error', err);
          const msg = err?.error?.message || err?.message || 'Failed to update status';
          this.alert.error(msg);
          this.cd.detectChanges();
        }
      });
      return;
    }

    // Fallback: generic QR/unit update endpoint
    // IMPORTANT: ensure qrService.updateUnitStatus(type, unitId, payload) exists in your project.
    this.qrService.updateUnitStatus(itemType, unitId, { status }).pipe(first()).subscribe({
      next: () => {
        this.updating = false;
        this.openUpdateMenu = false;
        this.alert.success(`Status set to "${status}"`);
        this.resetAfterRelease();
      },
      error: (err) => {
        this.updating = false;
        this.openUpdateMenu = false;
        console.error('[Scan] updateUnitStatus error', err);
        const msg = err?.error?.message || err?.message || 'Failed to update status';
        this.alert.error(msg);
      }
    });
  }
}

/** small helper (kept from original file) */
function tryParseJson(s: any) {
  try { return JSON.parse(s); } catch (e) { return null; }
}
