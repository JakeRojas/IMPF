import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { RoomService, AlertService } from '@app/_services';

@Component({
  templateUrl: './release-list.component.html'
})
export class AdminSupplyReleasedListComponent implements OnInit {
  roomId = NaN;
  batches: any[] = [];
  loading = false;
  inventory: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.roomId = this.findRoomId(this.route);
    if (!Number.isFinite(this.roomId)) { this.alert.error('Invalid room id'); return; }
    this.loadBatches();
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

  loadBatches() {
    this.loading = true;
    this.roomService.getReleasedBatchAdminSupply(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => { this.batches = res || []; this.loading = false; },
      error: (err) => { this.loading = false; this.alert.error(err); }
    });
  }

  loadInventory() {
    this.roomService.getAdminSupplyInventory(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => this.inventory = res || [],
      error: (e) => this.alert.error(e)
    });
  }
}