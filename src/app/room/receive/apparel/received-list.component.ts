import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { RoomService, AlertService } from '@app/_services';

@Component({
  templateUrl: './received-list.component.html'
})
export class ApparelReceivedListComponent implements OnInit {
  roomId = NaN;
  batches: any[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.roomId = this.findRoomId(this.route);
    if (!Number.isFinite(this.roomId)) { this.alert.error('Invalid room id'); return; }
    this.loadBatches();
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
    this.roomService.getReceivedBatchApparels(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => { this.batches = res || []; this.loading = false; },
      error: (err) => { this.loading = false; this.alert.error(err); }
    });
  }
}