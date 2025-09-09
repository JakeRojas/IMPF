// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { first } from 'rxjs/operators';
// import { RoomService, AlertService } from '@app/_services';

// @Component({
//     templateUrl: './apparel-unit-list.component.html'
// })
// export class ApparelUnitListComponent implements OnInit {
//     roomId!: number;
//     units: any[] = [];
//     loading = false;
//     updatingId: number | null = null;
//     statuses = ['in_stock', 'active', 'released', 'lost', 'damaged', 'repair'];

//     constructor(
//         private route: ActivatedRoute,
//         private router: Router,
//         private roomService: RoomService,
//         private alertService: AlertService
//     ) {}

//     // ngOnInit(): void {
//     //     // read room id from parent route (works for nested child route)
//     //     const parent = this.route.parent || this.route;
//     //     const idParam = parent.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id');
//     //     this.roomId = idParam ? +idParam : NaN;

//     //     if (!this.roomId) {
//     //         this.alertService.error('Invalid room id');
//     //         return;
//     //     }

//     //     this.loadUnits();
//     // }

//     ngOnInit(): void {
//         // robustly search up the activated route tree for a param named 'id'
//         this.roomId = this.findRoomId(this.route);
    
//         if (!Number.isFinite(this.roomId)) {
//             this.alertService.error('Invalid room id');
//             return;
//         }
    
//         this.loadUnits();
//     }
    
//     /** Walk up the ActivatedRoute parents until we find an 'id' param */
//     private findRoomId(route: ActivatedRoute): number {
//         let r: ActivatedRoute | null = route;
//         while (r) {
//             const idParam = r.snapshot.paramMap.get('id');
//             if (idParam) return +idParam;
//             r = r.parent;
//         }
//         return NaN;
//     }

//     // loadUnits() {
//     //     this.loading = true;
//     //     this.roomService.getApparelUnits(this.roomId).pipe(first()).subscribe({
//     //         next: (res: any[]) => {
//     //             this.units = res || [];
//     //             this.loading = false;
//     //         },
//     //         error: (err) => {
//     //             this.alertService.error(err);
//     //             this.loading = false;
//     //         }
//     //     });
//     // }
//     loadUnits() {
//         if (!Number.isFinite(this.roomId)) {
//             this.alertService.error('Invalid room id');
//             return;
//         }
//         this.loading = true;
//         this.roomService.getApparelUnits(this.roomId).pipe(first()).subscribe({
//           next: (res: any[]) => {
//             console.log('[DEBUG] getApparelUnits response for room', this.roomId, res);
//             this.units = res || [];
//             this.loading = false;
//           },
//           error: (err) => {
//             console.error('[DEBUG] getApparelUnits error', err);
//             this.alertService.error(err);
//             this.loading = false;
//           }
//         });
//       }

//     updateStatus(unitId: number, newStatus: string) {
//         this.updatingId = unitId;
//         this.roomService.updateApparelStatus(this.roomId, unitId, newStatus).pipe(first()).subscribe({
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
//         // navigate back to the room view (without child route)
//         this.router.navigate(['/room', this.roomId]);
//     }
// }


import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { RoomService, AlertService } from '@app/_services';

@Component({
  selector: 'app-apparel-unit-list',
  templateUrl: './apparel-unit-list.component.html'
})
export class ApparelUnitListComponent implements OnInit {
  roomId: number = NaN;
  units: any[] = [];
  loading = false;
  updatingId: number | null = null;
  openMenuId: number | null = null;

  statuses: string[] = ['good', 'released', 'lost', 'damaged'];

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
    this.roomService.getApparelUnits(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => {
        this.units = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('[DEBUG] getApparelUnits error', err);
        this.alertService.error(err);
        this.loading = false;
      }
    });
  }

  unitIdOf(u: any): number | null {
    return (u && (u.id || u.apparelUnitId || u.unitId || u.apparelId)) ? +(u.id || u.apparelUnitId || u.unitId || u.apparelId) : null;
  }

  toggleMenu(id: number | null, event?: Event) {
    if (event) event.stopPropagation();
    if (!id) return;
    this.openMenuId = (this.openMenuId === id) ? null : id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(_: Event) {
    // close menu when clicking outside
    this.openMenuId = null;
  }

  updateStatus(unitObj: any, newStatus: string) {
    const unitId = this.unitIdOf(unitObj);
    if (!unitId) {
      this.alertService.error('Could not determine unit id for this row.');
      return;
    }
    if (!Number.isFinite(this.roomId)) {
      this.alertService.error('Invalid room id');
      return;
    }

    this.updatingId = unitId;
    // disable the menu while updating
    this.roomService.updateApparelStatus(this.roomId, unitId, newStatus).pipe(first()).subscribe({
      next: () => {
        this.updatingId = null;
        this.openMenuId = null;
        this.alertService.success(`Status updated to "${newStatus}"`);
        this.loadUnits();
      },
      error: (err) => {
        console.error('[DEBUG] updateApparelStatus error', err);
        const msg = err?.error?.message || err?.message || 'Failed to update status';
        this.alertService.error(msg);
        this.updatingId = null;
        this.openMenuId = null;
      }
    });
  }
}
