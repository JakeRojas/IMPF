import { Component, OnInit } from '@angular/core';
import { ActivatedRoute }     from '@angular/router';
import { first }              from 'rxjs/operators';

import { RoomService, AlertService } from '@app/_services';

@Component({
  templateUrl: './room-view.component.html'
})
export class RoomViewComponent implements OnInit {
  roomId!: number;
  room: any = {};
  stockPath: string = 'general';
  isStockroom = false;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.roomId = +this.route.snapshot.params['id'];
    if (!this.roomId) {
      this.alert.error('Room id is missing in route');
      return;
    }

    this.loadRoom();
  }

  private loadRoom() {
    this.roomService.getRoomById(this.roomId).pipe(first()).subscribe({
      next: (r: any) => {
        this.room = r || {};
        this.stockPath = this.computeStockPath(this.room);
        this.isStockroom = this.room.roomType === 'stockroom' || this.room.roomType === 'subStockroom';
      },
      error: (e) => this.alert.error(e)
    });
  }

  private computeStockPath(room: any): string {
    if (!room || !room.stockroomType) return 'general';
    const t = (room.stockroomType || '').toLowerCase();
    if (t === 'apparel') return 'apparel';
    if (t === 'supply') return 'supply';
    return 'general';
  }
}

