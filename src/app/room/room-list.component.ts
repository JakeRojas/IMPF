import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import {
    RoomService,
    AccountService,
    QrService,
    AlertService
} from '@app/_services';
import { Role } from '@app/_models';

@Component({ templateUrl: 'room-list.component.html' })
export class RoomListComponent implements OnInit {
    rooms: any[] = [];
    loading = false;
    isSuperAdmin = false;
    searchText = '';
    selectedType = '';

    constructor(
        private roomService: RoomService,
        private accountService: AccountService,
        private qrService: QrService,
        private alert: AlertService,

        private router: Router
    ) { }

    ngOnInit() {
        const user = this.accountService.accountValue;
        this.isSuperAdmin = user?.role === 'superAdmin';

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

    get filteredRooms() {
        return this.rooms.filter(r => {
            const matchesSearch = r.roomName.toLowerCase().includes(this.searchText.toLowerCase()) ||
                r.roomType.toLowerCase().includes(this.searchText.toLowerCase()) ||
                (r.stockroomType && r.stockroomType.toLowerCase().includes(this.searchText.toLowerCase()));
            const matchesType = this.selectedType ? r.roomType === this.selectedType : true;
            return matchesSearch && matchesType;
        });
    }

    get roomTypes() {
        const types = this.rooms.map(r => r.roomType);
        return [...new Set(types)];
    }

    view(room: any) {
        this.router.navigate(['/room', room.roomId]);
    }

    updateRoom(room: any) {
        this.router.navigate(['/room/edit', room.roomId]);
    }
}