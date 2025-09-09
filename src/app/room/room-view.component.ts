import { Component, OnInit }                  from '@angular/core';
import { ActivatedRoute }                     from '@angular/router';
import { first }                              from 'rxjs/operators';
import { HttpResponse }                       from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  RoomService,
  QrService,
  AlertService,
} from '@app/_services';

@Component({
  templateUrl: './room-view.component.html'
})
export class RoomViewComponent implements OnInit {
  roomId!:          number;
  room:             any = {};
  inventory:        any[] = [];
  receivedItems:    any[] = [];
  releasedBatches:  any[] = [];
  roomItems:        any[] = [];
  inChargeOptions:  any[] = [];

  // --- added props for QR scanning panel ---
  scanned: any = null;
  showScannedPanel = false;
  account: any = null; // set from account/auth service if available

  scannedNewStatus: string = 'damage';

  // modal visibility flags
  showReceiveModal = false;
  showReleaseModal = false;

  // forms
  receiveForm!:   FormGroup;
  releaseForm!:   FormGroup;
  registerForm!:  FormGroup;
  statusForm!:    FormGroup;

  loading     = false;
  submitting  = false;

  constructor(
    private route:        ActivatedRoute,
    private fb:           FormBuilder,
    private roomService:  RoomService,
    private qrService:    QrService,
    private alert:        AlertService,
  ) {}

  ngOnInit() {
    this.roomId = +this.route.snapshot.params['id'];

    // TODO: assign this.account from your auth/account service here if available
    // this.account = this.authService.accountValue;

    // Receive form (keeps fields for both apparel and supply; we submit what is filled)
    this.receiveForm = this.fb.group({
      // apparel fields
      apparelName:      [''],
      apparelQuantity:  [0],
      apparelLevel:     [''],
      apparelType:      [''],
      apparelFor:       [''],
      apparelSize:      [''],
      // supply fields
      supplyName:       [''],
      adminQuantity:    [0],
      // common
      receivedFrom:     ['', Validators.required],
      receivedBy:       ['', Validators.required],
      notes:            ['']
    });

    // Release form (batch)
    this.releaseForm = this.fb.group({
      apparelInventoryId: [null,  Validators.required],
      releaseQuantity:    [1,     [Validators.required, Validators.min(1)]],
      releasedBy:         ['',    Validators.required],
      claimedBy:          ['',    Validators.required],
      remarks:            ['']
    });

    this.registerForm = this.fb.group({ itemId:     [null,  Validators.required] });
    this.statusForm   = this.fb.group({ itemQrCode: ['',    Validators.required], newStatus: ['', Validators.required] });

    this.loadAll();
  }

  loadAll() {
    this.loading = true;

    // fetch the room first so we know stockroomType
    this.roomService.getRoomById(this.roomId).pipe(first()).subscribe({
      next: r => {
        this.room = r || {};
        const st = (this.room.stockroomType || 'apparel').toString().toLowerCase();

        // reset data arrays
        this.inventory = [];
        this.receivedItems = [];
        this.releasedBatches = [];
        this.roomItems = [];

        // in-charge options (used in receive/release forms)
        this.roomService.getInChargeOptions().pipe(first()).subscribe({
          next: opts => this.inChargeOptions = opts || [],
          error: () => { /* non-fatal */ }
        });

        // ------------- APPAREL -------------
        if (!st || st === 'apparel') {
          this.roomService.getApparelInventory(this.roomId).pipe(first()).subscribe({
            next: inv => this.inventory = inv || [],
            error: e => this.alert.error(e)
          });
          this.roomService.getReceivedBatchApparels(this.roomId).pipe(first()).subscribe({
            next: rcv => this.receivedItems = rcv?.items || rcv || [],
            error: e => this.alert.error(e)
          });
          this.roomService.getReleasedBatchAppparel(this.roomId).pipe(first()).subscribe({
            next: r => this.releasedBatches = r?.batches || r || [],
            error: e => this.alert.error(e)
          });
          this.roomService.getApparelUnits(this.roomId).pipe(first()).subscribe({
            next: items => this.roomItems = items || [],
            error: e => this.alert.error(e)
          });
        // ------------- ADMIN SUPPLY -------------
        } else if (st === 'supply') {
          this.roomService.getAdminSupplyInventory(this.roomId).pipe(first()).subscribe({
            next: inv => this.inventory = inv || [],
            error: e => this.alert.error(e)
          });
          this.roomService.getReceivedBatchAdminSupply(this.roomId).pipe(first()).subscribe({
            next: rcv => this.receivedItems = rcv?.items || rcv || [],
            error: e => this.alert.error(e)
          });
          this.roomService.getAdminSupplyUnits(this.roomId).pipe(first()).subscribe({
            next: items => this.roomItems = items || [],
            error: e => this.alert.error(e)
          });
          this.roomService.getReleasedBatchAdminSupply(this.roomId).pipe(first()).subscribe({
            next: r => this.releasedBatches = r?.batches || r || [],
            error: () => {}
          });
        // ------------- GENERAL ITEMS -------------
        } else {
          this.roomService.getGenItemInventory(this.roomId).pipe(first()).subscribe({
            next: inv => this.inventory = inv || [],
            error: e => this.alert.error(e)
          });
          this.roomService.getReceivedBatchGenItem(this.roomId).pipe(first()).subscribe({
            next: rcv => this.receivedItems = rcv?.items || rcv || [],
            error: e => this.alert.error(e)
          });
          this.roomService.getGenItemUnits(this.roomId).pipe(first()).subscribe({
            next: items => this.roomItems = items || [],
            error: e => this.alert.error(e)
          });
          this.roomService.getReleasedBatchGenItem(this.roomId).pipe(first()).subscribe({
            next: r => this.releasedBatches = r?.batches || r || [],
            error: () => {}
          });
        }

        this.loading = false;
      },
      error: e => { this.alert.error(e); this.loading = false; }
    });
  }

  // ------------------------ Modal open/close helpers --------------------------
  openReceiveModal() {
    this.receiveForm.reset({
      apparelName: '',
      apparelQuantity: 0,
      supplyName: '',
      adminQuantity: 0,
      receivedFrom: '',
      receivedBy: '',
      notes: ''
    });
    this.showReceiveModal = true;
  }
  closeReceiveModal() { this.showReceiveModal = false; }

  openReleaseModal(prefillInventoryId?: number) {
    this.releaseForm.reset({
      apparelInventoryId: prefillInventoryId || null,
      releaseQuantity: 1,
      releasedBy: '',
      claimedBy: '',
      remarks: ''
    });
    this.showReleaseModal = true;
  }
  closeReleaseModal() { this.showReleaseModal = false; }

  // ------------------------ Modal actions --------------------------------
  onReceive() {
    if (this.receiveForm.invalid) {
      this.alert.error('Please fill required receive fields.');
      return;
    }
    this.submitting = true;

    // Build payload depending on room type:
    const st = (this.room.stockroomType || 'apparel').toString().toLowerCase();
    let payload: any = {
      receivedFrom: this.receiveForm.value.receivedFrom,
      receivedBy: this.receiveForm.value.receivedBy,
      notes: this.receiveForm.value.notes
    };

    if (!st || st === 'apparel') {
      payload = {
        ...payload,
        apparelName: this.receiveForm.value.apparelName,
        apparelQuantity: this.receiveForm.value.apparelQuantity,
        apparelLevel: this.receiveForm.value.apparelLevel,
        apparelType: this.receiveForm.value.apparelType,
        apparelFor: this.receiveForm.value.apparelFor,
        apparelSize: this.receiveForm.value.apparelSize
      };
    } else if (st === 'supply') {
      payload = {
        ...payload,
        supplyName: this.receiveForm.value.supplyName,
        adminQuantity: this.receiveForm.value.adminQuantity
      };
    } else {
      // general / items
      // re-use apparel fields or use supplyName depending on your backend expectations
      payload = {
        ...payload,
        itemName: this.receiveForm.value.supplyName || this.receiveForm.value.apparelName,
        itemQuantity: this.receiveForm.value.adminQuantity || this.receiveForm.value.apparelQuantity
      };
    }

    this.roomService.receiveItem(this.roomId, payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Received successfully');
        this.submitting = false;
        this.closeReceiveModal();
        this.loadAll();
      },
      error: e => { this.alert.error(e); this.submitting = false; }
    });
  }

  onRelease() {
    if (this.releaseForm.invalid) {
      this.alert.error('Please fill required release fields.');
      return;
    }
    this.submitting = true;

    // Normalize payload field names to backend expected ones
    const payload: any = {
      apparelInventoryId: this.releaseForm.value.apparelInventoryId,
      releaseQuantity: this.releaseForm.value.releaseQuantity,
      releasedBy: this.releaseForm.value.releasedBy,
      claimedBy: this.releaseForm.value.claimedBy,
      notes: this.releaseForm.value.remarks
    };

    this.roomService.releaseApparel(this.roomId, payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Released successfully');
        this.submitting = false;
        this.closeReleaseModal();
        this.loadAll();
      },
      error: e => { this.alert.error(e); this.submitting = false; }
    });
  }

  // ------------------------ QR Scanning handlers ------------------------------
  handleScannedPayload(parsedPayload: any) {
    this.scanned = parsedPayload;
    this.showScannedPanel = true;
  }

  releaseScannedUnit() {
    if (!this.scanned) return;

    // unit-level QR
    if (this.scanned.unitId) {
      const stockroomType = this.scanned.itemType || (this.room.stockroomType || 'apparel');
      const unitId = this.scanned.unitId;
      this.qrService.releaseUnit(stockroomType, unitId, { actorId: this.account?.accountId }).pipe(first())
        .subscribe({
          next: () => {
            this.alert.success('Unit released');
            this.showScannedPanel = false;
            this.loadAll();
          },
          error: e => this.alert.error(e)
        });

    // batch-level QR (inventory)
    } else if (this.scanned.id || this.scanned.inventoryId || this.scanned.apparelInventoryId) {
      const inventoryId = this.scanned.id || this.scanned.inventoryId || this.scanned.apparelInventoryId;
      const qtyStr = window.prompt('Batch QR detected. How many units to release?', '1');
      const qty = parseInt(qtyStr || '0', 10);
      if (!qty || qty <= 0) return;

      const payload = {
        apparelInventoryId: inventoryId,
        releaseQuantity: qty,
        releasedBy: `${this.account?.firstName || ''} ${this.account?.lastName || ''}`.trim(),
        claimedBy: '',
        notes: `Released via QR on ${new Date().toISOString()}`
      };

      this.roomService.releaseApparel(this.roomId, payload).pipe(first()).subscribe({
        next: () => {
          this.alert.success('Batch released');
          this.showScannedPanel = false;
          this.loadAll();
        },
        error: e => this.alert.error(e)
      });
    }
  }

  // toggleScannedStatus() {
  //   if (!this.scanned) return;
  //   const newStatus = (this.scanned.status === 'goods' || this.scanned.status === 'in_stock') ? 'damage' : 'goods';
  //   const idToUpdate = this.scanned.unitId || this.scanned.qrId || this.scanned.id;
  //   if (!idToUpdate) {
  //     this.alert.error('Cannot determine item id to update status.');
  //     return;
  //   }
  //   // if roomService.updateItemStatus exists, use it
  //   this.roomService.updateItemStatus(this.roomId, idToUpdate, newStatus).pipe(first()).subscribe({
  //     next: () => {
  //       this.alert.success(`Status changed to ${newStatus}`);
  //       this.loadAll();
  //       this.scanned.status = newStatus;
  //     },
  //     error: e => this.alert.error(e)
  //   });
  // }

  // ------------------------ QR download helpers -------------------------------
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'qrcode.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  parseFilenameFromContentDisposition(cdHeader: string | null, fallback: string) {
    if (!cdHeader) return fallback;
    const match = /filename\*?=(?:UTF-8'')?\"?([^\";]+)/i.exec(cdHeader);
    if (match && match[1]) {
      try { return decodeURIComponent(match[1]); } catch (e) { return match[1]; }
    }
    return fallback;
  }

  onDownloadBatchQr(invOrBatch: any) {
    const stockroomType = (this.room && this.room.stockroomType) ? this.room.stockroomType : 'apparel';
    const inventoryId = invOrBatch.receiveApparelId || invOrBatch.apparelInventoryId || invOrBatch.id || invOrBatch.inventoryId;
    if (!inventoryId) {
      this.alert.error('Cannot determine inventory id for QR generation.');
      return;
    }

    this.qrService.getBatchQr(stockroomType, inventoryId).pipe(first())
      .subscribe({
        next: (resp: HttpResponse<Blob>) => {
          const blob = resp.body as Blob;
          const cd = resp.headers.get('Content-Disposition');
          const fallback = `qr-${stockroomType}-${inventoryId}.png`;
          const filename = this.parseFilenameFromContentDisposition(cd, fallback);
          this.downloadBlob(blob, filename);
          this.alert.success('QR downloaded and backend saved/updated (if not already).');
        },
        error: err => {
          this.alert.error(err);
        }
      });
  }

  onDownloadUnitQr(unit: any) {
    const stockroomType = (this.room && this.room.stockroomType) ? this.room.stockroomType : 'apparel';
    const unitId = unit.apparelId || unit.adminSupplyId || unit.id || unit.unitId;
    if (!unitId) { this.alert.error('Cannot determine unit id for QR generation.'); return; }

    // this.qrService.getUnitQr(stockroomType, unitId).pipe(first())
    //   .subscribe({
    //     next: (resp: HttpResponse<Blob>) => {
    //       const blob = resp.body as Blob;
    //       const cd = resp.headers.get('Content-Disposition');
    //       const fallback = `qr-${stockroomType}-unit-${unitId}.png`;
    //       const filename = this.parseFilenameFromContentDisposition(cd, fallback);
    //       this.downloadBlob(blob, filename);
    //       this.alert.success('Unit QR downloaded and backend saved/updated (if not already).');
    //     },
    //     error: err => {
    //       this.alert.error(err);
    //     }
    //   });
  }
}
