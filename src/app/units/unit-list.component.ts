import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QrService } from '../_services/qr.service';
import { RoomService } from '../_services/room.service';
import { AlertService } from '../_services/alert.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-unit-list',
  templateUrl: './unit-list.component.html'
})
export class UnitListComponent implements OnInit {
  roomId!: number;
  units: any[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private qrService: QrService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.roomId = Number(this.route.snapshot.paramMap.get('roomId'));
    if (!this.roomId) {
      this.alert.error('Room id missing in route');
      return;
    }
    this.loadUnits();
  }

  loadUnits() {
    this.loading = true;
    // Assuming you have a method like getUnitsByRoom or getRoomUnits; adapt name if necessary
    this.roomService.getRoomItems(this.roomId).pipe(first()).subscribe({
      next: (res: any) => {
        // adapt depending on your API shape (res.units vs res.data)
        this.units = Array.isArray(res) ? res : (res.units || res.data || []);
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.alert.error(e?.error?.message || e?.message || 'Failed to load units');
      }
    });
  }

  generateQr(unit: any) {
    // determine stockroomType from unit or fallback to 'apparel'
    const stockroomType = unit.itemType || unit.stockroomType || 'apparel';
    const unitId = unit.id || unit.unitId || unit.apparelId;
    if (!unitId) {
      this.alert.error('Unit id not available for this item');
      return;
    }

    this.qrService.getUnitQr(stockroomType, unitId).pipe(first()).subscribe({
      next: (blob: Blob) => {
        // create an object URL and download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${stockroomType}_unit_${unitId}_qr.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        // revoke after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        this.alert.success('QR downloaded');
      },
      error: (e) => {
        this.alert.error(e?.error?.message || e?.message || 'Failed to generate QR');
      }
    });
  }

  openQrInNewTab(unit: any) {
    // alternate UX: open QR in new tab (useful to preview)
    const stockroomType = unit.itemType || unit.stockroomType || 'apparel';
    const unitId = unit.id || unit.unitId || unit.apparelId;
    const url = `/qr/${stockroomType}/unit/${unitId}/qrcode`;
    // this assumes the backend URL is reachable under same origin or via proxy
    window.open(url, '_blank');
  }
}
