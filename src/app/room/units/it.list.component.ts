import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { RoomService, AlertService, QrService } from '@app/_services';

@Component({
    templateUrl: './it.list.component.html'
})
export class ItUnitListComponent implements OnInit {
    roomId = NaN;
    units: any[] = [];
    loading = false;

    get totalUnitsCount(): number {
        return this.total || 0;
    }

    // Pagination
    page = 1;
    limit = 10;
    total = 0;
    totalPages = 0;

    constructor(
        public route: ActivatedRoute,
        private roomService: RoomService,
        private alert: AlertService,
        private qrService: QrService
    ) { }

    ngOnInit(): void {
        this.roomId = this.findRoomId(this.route);
        if (!Number.isFinite(this.roomId)) { this.alert.error('Invalid room id'); return; }
        this.loadUnits();
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

    loadUnits() {
        this.loading = true;
        this.roomService.getItUnits(this.roomId, this.page, this.limit).pipe(first()).subscribe({
            next: (res: any) => {
                if (res.data) {
                    this.units = res.data;
                    this.total = res.meta.total;
                    this.totalPages = res.meta.totalPages;
                } else {
                    this.units = res || [];
                    this.total = this.units.length;
                    this.totalPages = 1;
                }
                this.selection.clear();
                this.loading = false;
            },
            error: (err) => { this.loading = false; this.alert.error(err); }
        });
    }

    onPageChange(p: number) {
        this.page = p;
        this.loadUnits();
    }

    range(start: number, end: number): number[] {
        return [...Array(end - start + 1).keys()].map(i => i + start);
    }

    generateAllUnitsQr() {
        if (!Number.isFinite(this.roomId)) { this.alert.error('Invalid room'); return; }
        const stockroomType = 'it';

        this.qrService.downloadAllUnitsPdf(stockroomType, this.roomId).pipe(first()).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `qrcodes-all-it-units-${this.roomId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                this.alert.success('Units PDF downloaded');
                this.loadUnits();
            },
            error: (err) => {
                console.error('generateAllUnitsQr error', err);
                const msg = err?.error?.message || err?.message || 'Failed to generate units PDF';
                this.alert.error(msg);
            }
        });
    }

    startEdit(u: any) {
        u._orig = { description: u.description, status: u.status };
        u.editing = true;
    }

    cancelEdit(u: any) {
        if (u._orig) {
            u.description = u._orig.description;
            u.status = u._orig.status;
            delete u._orig;
        }
        u.editing = false;
    }

    saveUnit(u: any) {
        const payload: any = { description: u.description, status: u.status };
        this.roomService.updateItUnit(this.roomId, u.itId, payload).pipe(first()).subscribe({
            next: (updated: any) => {
                Object.assign(u, updated);
                u.editing = false;
                this.alert.success('Unit updated');
            },
            error: (err) => {
                this.alert.error(err?.error?.message || err?.message || 'Update failed');
            }
        });
    }

    downloadUnitQr(u: any) {
        const stockroomType = 'it';
        const unitId = u.itId || u.id;

        this.qrService.getUnitQr(stockroomType, unitId).pipe(first()).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `it-unit-${unitId}-qr.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                this.alert.success('Unit QR downloaded');
                this.loadUnits();
            },
            error: (err) => {
                console.error('downloadUnitQr error', err);
                this.alert.error('Failed to download QR code');
            }
        });
    }

    // Selection Logic
    selection = new Set<string>();
    isSelected(u: any): boolean {
        return this.selection.has(`it:${u.itId || u.id}`);
    }
    toggleSelection(u: any) {
        const key = `it:${u.itId || u.id}`;
        if (this.selection.has(key)) {
            this.selection.delete(key);
        } else {
            this.selection.add(key);
        }
    }
    get allSelected(): boolean {
        return this.units.length > 0 && this.selection.size === this.units.length;
    }
    toggleSelectAll() {
        if (this.allSelected) {
            this.selection.clear();
        } else {
            this.units.forEach(u => this.selection.add(`it:${u.itId || u.id}`));
        }
    }

    generateSelectedQr() {
        if (this.selection.size === 0) {
            this.alert.error('No units selected');
            return;
        }
        const stockroomType = 'it';
        const keys = Array.from(this.selection);
        const ids = keys.map(k => Number(k.split(':')[1]));

        this.qrService.downloadSelectedUnitsPdf(stockroomType, ids).pipe(first()).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `qrcodes-selected-it.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                this.alert.success('Selected Units PDF downloaded');
                this.loadUnits();
            },
            error: (err) => {
                console.error('generateSelectedQr error', err);
                this.alert.error(err?.error?.message || 'Failed to generate PDF');
            }
        });
    }
}
