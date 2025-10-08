import { Component, OnInit } from '@angular/core';
import { ActivatedRoute }     from '@angular/router';
import { first }              from 'rxjs/operators';
import { RoomService, AlertService, QrService  } from '@app/_services';

@Component({
  templateUrl: './apparel-inventory-list.component.html'
})
export class ApparelInventoryListComponent implements OnInit {
  roomId = NaN;
  inventory: any[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private alert: AlertService,
    private qrService: QrService
  ) {}

  ngOnInit(): void {
    this.roomId = this.findRoomId(this.route);
    if (!Number.isFinite(this.roomId)) { this.alert.error('Invalid room id'); return; }
    this.loadInventory();
  }

  private findRoomId(route: ActivatedRoute): number {
    let r: ActivatedRoute | null = route;
    while (r) {
      const idParam = r.snapshot.paramMap.get('id');
      if (idParam) return +idParam;
      r = r.parent;
    }
    return NaN;
  }

  loadInventory() {
    this.loading = true;
    this.roomService.getApparelInventory(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => { this.inventory = res || []; this.loading = false; },
      error: (e) => { this.loading = false; this.alert.error(e); }
    });
  }

  generateAllQr() {
    if (!Number.isFinite(this.roomId)) { this.alert.error('Invalid room'); return; }
    // stockroomType for this list is 'supply' (example). Adjust for other inventory views.
    const stockroomType = 'apparel'; // change to 'apparel' or 'genitem' where appropriate
  
    this.qrService.downloadAllPdf(stockroomType, this.roomId).pipe(first()).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcodes-${stockroomType}-room-${this.roomId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.alert.success('PDF downloaded');
      },
      error: (err) => {
        console.error('generateAllQr error', err);
        const msg = err?.error?.message || err?.message || 'Failed to generate PDF';
        this.alert.error(msg);
      }
    });
  }

  downloadItemQr(i: any) {
    // determine correct stockroomType and id field for this view
    const stockroomType = 'apparel'; // change as appropriate per list
    const inventoryId = i.apparelInventoryId;
  
    this.qrService.getBatchQr(stockroomType, inventoryId).pipe(first()).subscribe({
      next: (blob: Blob) => {
        // download the blob
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${stockroomType}-${inventoryId}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
  
        // Mark item as generated in UI
        i.qrStatus = true;
  
        // Optional: show confirmation and/or refresh from server to sync state
        this.alert.success('QR downloaded and marked generated');
  
        // OPTIONAL: if you prefer to get canonical value from server:
        // this.load(); // reload items from API
      },
      error: err => {
        const msg = err?.error?.message || err?.message || 'Failed to download QR';
        this.alert.error(msg);
      }
    });
  }
}