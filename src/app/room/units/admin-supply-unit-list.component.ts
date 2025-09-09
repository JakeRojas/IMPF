// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { first } from 'rxjs/operators';
// import { RoomService, AlertService } from '@app/_services';

// @Component({
//     templateUrl: './admin-supply-unit-list.component.html'
// })
// export class AdminSupplyUnitListComponent implements OnInit {
//     roomId!: number;
//     units: any[] = [];
//     loading = false;
//     updatingId: number | null = null;

//     constructor(
//         private route: ActivatedRoute,
//         private router: Router,
//         private roomService: RoomService,
//         private alertService: AlertService
//     ) {}

//     ngOnInit(): void {
//         const parent = this.route.parent || this.route;
//         const idParam = parent.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id');
//         this.roomId = idParam ? +idParam : NaN;

//         if (!this.roomId) {
//             this.alertService.error('Invalid room id');
//             return;
//         }

//         this.loadUnits();
//     }

//     loadUnits() {
//         this.loading = true;
//         this.roomService.getAdminSupplyUnits(this.roomId).pipe(first()).subscribe({
//             next: (res: any[]) => {
//                 this.units = res || [];
//                 this.loading = false;
//             },
//             error: (err) => {
//                 this.alertService.error(err);
//                 this.loading = false;
//             }
//         });
//     }

//     updateStatus(unitId: number, newStatus: string) {
//         this.updatingId = unitId;
//         this.roomService.updateAdminSupplyStatus(this.roomId, unitId, newStatus).pipe(first()).subscribe({
//             next: () => {
//                 this.updatingId = null;
//                 this.loadUnits();
//             },
//             error: (err) => {
//                 this.alertService.error(err);
//                 this.updatingId = null;
//             }
//         });
//     }

//     goBack() {
//         this.router.navigate(['/room', this.roomId]);
//     }
// }


import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { RoomService, AlertService } from '@app/_services';

@Component({
  selector: 'app-admin-supply-unit-list',
  templateUrl: './admin-supply-unit-list.component.html'
})
export class AdminSupplyUnitListComponent implements OnInit {
  roomId: number = NaN;
  units: any[] = [];
  loading = false;
  updatingId: number | null = null;
  statuses: string[] = ['in_stock', 'active', 'released', 'lost', 'damaged', 'repair'];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.roomId = this.findRoomId(this.route);
    if (!Number.isFinite(this.roomId)) {
      this.alertService.error('Invalid room id');
      return;
    }
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
    if (!Number.isFinite(this.roomId)) {
      this.alertService.error('Invalid room id');
      return;
    }
    this.loading = true;
    this.roomService.getAdminSupplyUnits(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => {
        this.units = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('[DEBUG] getAdminSupplyUnits error', err);
        this.alertService.error(err);
        this.loading = false;
      }
    });
  }

  unitIdOf(u: any): number | null {
    return (u && (u.id || u.adminSupplyUnitId || u.unitId)) ? +(u.id || u.adminSupplyUnitId || u.unitId) : null;
  }

  updateStatus(unitObj: any, newStatus: string) {
    const unitId = this.unitIdOf(unitObj);
    if (!unitId) {
      this.alertService.error('Could not determine unit id for this row.');
      return;
    }
    this.updatingId = unitId;
    this.roomService.updateAdminSupplyStatus(this.roomId, unitId, newStatus).pipe(first()).subscribe({
      next: () => {
        this.updatingId = null;
        this.alertService.success(`Status updated to "${newStatus}"`);
        this.loadUnits();
      },
      error: (err) => {
        console.error('[DEBUG] updateAdminSupplyStatus error', err);
        const msg = err?.error?.message || err?.message || 'Failed to update status';
        this.alertService.error(msg);
        this.updatingId = null;
      }
    });
  }
}
