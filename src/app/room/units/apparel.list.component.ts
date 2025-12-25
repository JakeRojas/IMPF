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
  ) {}

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
      next: (res: any[]) => { this.units = res || []; this.loading = false; },
      error: (err) => { this.loading = false; this.alert.error(err); }
    });
  }

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
}