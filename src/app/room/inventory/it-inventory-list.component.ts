import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { RoomService, AlertService, QrService } from '@app/_services';

@Component({
    templateUrl: './it-inventory-list.component.html'
})
export class ItInventoryListComponent implements OnInit {
    roomId = NaN;
    inventory: any[] = [];
    loading = false;

    constructor(
        public route: ActivatedRoute,
        private roomService: RoomService,
        private alert: AlertService,
        private qrService: QrService
    ) { }

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
        this.roomService.getItInventory(this.roomId).pipe(first()).subscribe({
            next: (res: any[]) => { this.inventory = res || []; this.loading = false; },
            error: (e) => { this.loading = false; this.alert.error(e); }
        });
    }

    displayQty(it: any) {
        return it.totalQuantity ?? it.quantity ?? '-';
    }

    generateAllQr() {
        if (!Number.isFinite(this.roomId)) { this.alert.error('Invalid room'); return; }
        const stockroomType = 'it';

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
                this.loadInventory();
            },
            error: (err) => {
                console.error('generateAllQr error', err);
                const msg = err?.error?.message || err?.message || 'Failed to generate PDF';
                this.alert.error(msg);
            }
        });
    }

    downloadItemQr(i: any) {
        const stockroomType = 'it';
        const inventoryId = i.itInventoryId || i.id;

        this.qrService.getBatchQr(stockroomType, inventoryId).pipe(first()).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `qr-${stockroomType}-${inventoryId}.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                this.loadInventory();
                this.alert.success('QR downloaded and marked generated');
            },
            error: err => {
                const msg = err?.error?.message || err?.message || 'Failed to download QR';
                this.alert.error(msg);
            }
        });
    }
}
