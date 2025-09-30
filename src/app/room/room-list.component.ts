import { Component, OnInit,}  from '@angular/core';
import { Router }             from '@angular/router';
import { first }              from 'rxjs/operators';

import { 
  RoomService, 
  QrService, 
  AlertService 
} from '@app/_services';

@Component({ templateUrl: 'room-list.component.html' })
export class RoomListComponent implements OnInit {
  rooms: any[] = [];
  loading = false;

  constructor(
    private roomService:  RoomService,
    private qrService:    QrService,
    private alert:        AlertService,

    private router:       Router
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.roomService.getRooms()
      .pipe(first())
      .subscribe({
        next: rooms => { this.rooms = rooms; this.loading = false; },
        error: err => { this.alert.error(err); this.loading = false; }
      });
  }

  view(room: any) {
    this.router.navigate(['/room', room.roomId]);
  }

  updateRoom(room: any) {
    this.router.navigate(['/room/edit', room.roomId]);
  }
}