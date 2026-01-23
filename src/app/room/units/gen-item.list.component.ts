import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { RoomService, AlertService, QrService } from '@app/_services';

@Component({
  templateUrl: './gen-item.list.component.html'
})
export class GenItemUnitListComponent implements OnInit {
  roomId = NaN;
  units: any[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
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
    this.roomService.getAllUnits(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => {
        this.units = res || [];
        this.selection.clear();
        this.loading = false;
      },
      error: (err) => { this.loading = false; this.alert.error(err); }
    });
  }

  generateAllUnitsQr() {
    if (!Number.isFinite(this.roomId)) { this.alert.error('Invalid room'); return; }
    const stockroomType = 'general'; // Handled as mixed in backend

    this.qrService.downloadAllUnitsPdf(stockroomType, this.roomId).pipe(first()).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcodes-all-room-${this.roomId}-units.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.alert.success('Units PDF downloaded');
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
    let obs;
    if (u.unitType === 'apparel') {
      obs = this.roomService.updateApparelUnit(this.roomId, u.apparelId, payload);
    } else if (u.unitType === 'supply') {
      obs = this.roomService.updateAdminSupplyUnit(this.roomId, u.adminSupplyId, payload);
    } else {
      obs = this.roomService.updateGenItemUnit(this.roomId, u.genItemId, payload);
    }

    obs.pipe(first()).subscribe({
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
    // Map unitType UI label to backend stockroomType string if needed
    let stockroomType = u.unitType;
    if (stockroomType === 'genitem') stockroomType = 'genitem'; // already set correctly usually

    // For general item units, the ID might be under different names
    const unitId = u.apparelId || u.adminSupplyId || u.genItemId || u.id;

    this.qrService.getUnitQr(stockroomType, unitId).pipe(first()).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${stockroomType}-unit-${unitId}-qr.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.alert.success('Unit QR downloaded');
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
    return this.selection.has(`${u.unitType}:${u.id}`);
  }
  toggleSelection(u: any) {
    const key = `${u.unitType}:${u.id}`;
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
      this.units.forEach(u => this.selection.add(`${u.unitType}:${u.id}`));
    }
  }

  generateSelectedQr() {
    if (this.selection.size === 0) {
      this.alert.error('No units selected');
      return;
    }
    const stockroomType = 'general';
    const keys = Array.from(this.selection);
    const ids = keys.map(k => Number(k.split(':')[1]));

    this.qrService.downloadSelectedUnitsPdf(stockroomType, ids).pipe(first()).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcodes-selected.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.alert.success('Selected Units PDF downloaded');
      },
      error: (err) => {
        console.error('generateSelectedQr error', err);
        this.alert.error(err?.error?.message || 'Failed to generate PDF');
      }
    });
  }
}
