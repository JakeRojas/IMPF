import { Component, OnInit } from '@angular/core';
import { ActivatedRoute }     from '@angular/router';
import { first }              from 'rxjs/operators';
import { RoomService, AlertService } from '@app/_services';

@Component({
  templateUrl: './gen-item-inventory-list.component.html'
})
export class GenItemInventoryListComponent implements OnInit {
  roomId = NaN;
  inventory: any[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private alert: AlertService
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
    this.roomService.getGenItemInventory(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => { this.inventory = res || []; this.loading = false; },
      error: (e) => { this.loading = false; this.alert.error(e); }
    });
  }

  displayQty(it: any) {
    return it.totalQuantity ?? it.quantity ?? '-';
  }
}
