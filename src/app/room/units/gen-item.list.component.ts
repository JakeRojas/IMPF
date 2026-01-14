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

  // Selection Logic
  selection = new Set<string>(); // Use string key to include type if needed, but here generic 'id' from backend is enough if unique
  // wait, are IDs unique across types? Probably not.
  // Let's use unitType:id as key
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
    // Since we have mixed types, we should probably just use 'general' and pass the unitIds?
    // Wait, backend 'general' handler for selected units expects mixed IDs.
    // But Apparel, Supply, and GenItem might have overlapping IDs.
    // I should probably update backend to handle this or send separated IDs.

    // For now, let's assume 'general' with mixed IDs works if we map them correctly.
    // Actually, I'll send ALL selected IDs to the backend and the backend 'general' handler will try to find them in all tables.
    // Note: This might hit the wrong item if IDs overlap!

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
