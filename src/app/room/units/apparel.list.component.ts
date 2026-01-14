import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { RoomService, AlertService, QrService } from '@app/_services';

@Component({
  templateUrl: './apparel.list.component.html'
})
export class ApparelUnitListComponent implements OnInit {
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
    this.roomService.getApparelUnits(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => {
        this.units = res || [];
        this.selection.clear();
        this.loading = false;
      },
      error: (err) => { this.loading = false; this.alert.error(err); }
    });
  }
  // loadUnits() {
  //   // ...
  //   this.roomService.get...(...).subscribe({
  //     next: (res) => {
  //       this.units = res || [];
  //       this.selection.clear(); // Add this
  //       this.loading = false;
  //     },
  //     // ...
  //   });
  // }

  generateAllUnitsQr() {
    if (!Number.isFinite(this.roomId)) { this.alert.error('Invalid room'); return; }
    const stockroomType = 'apparel'; // change to 'apparel' | 'supply' | 'genitem' depending on this view

    this.qrService.downloadAllUnitsPdf(stockroomType, this.roomId).pipe(first()).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcodes-${stockroomType}-room-${this.roomId}-units.pdf`;
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
    // mark editing state and make a shallow copy of original values for cancel
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
    // simple validation: only send description & status
    const payload: any = { description: u.description, status: u.status };
    this.roomService.updateApparelUnit(this.roomId, u.apparelId, payload).pipe(first()).subscribe({
      next: (updated: any) => {
        // update local row from server response (optional)
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
  selection = new Set<number>();
  get allSelected(): boolean {
    return this.units.length > 0 && this.selection.size === this.units.length;
  }
  toggleSelectAll() {
    if (this.allSelected) {
      this.selection.clear();
    } else {
      // Note: Use correct ID field based on component (apparelId, adminSupplyId, genItemId)
      this.units.forEach(u => this.selection.add(u.apparelId));
    }
  }
  toggleSelection(id: number) {
    if (this.selection.has(id)) {
      this.selection.delete(id);
    } else {
      this.selection.add(id);
    }
  }
  isSelected(id: number): boolean {
    return this.selection.has(id);
  }
  generateSelectedQr() {
    if (this.selection.size === 0) {
      this.alert.error('No units selected');
      return;
    }
    const stockroomType = 'apparel'; // Update this for Supply/GenItem
    const ids = Array.from(this.selection);
    this.qrService.downloadSelectedUnitsPdf(stockroomType, ids).pipe(first()).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcodes-${stockroomType}-selected.pdf`;
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