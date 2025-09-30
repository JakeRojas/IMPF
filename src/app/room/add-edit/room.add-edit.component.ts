// import { Component, OnInit }                    from '@angular/core';
// import { Router, ActivatedRoute }               from '@angular/router';
// import { FormBuilder, FormGroup, Validators }   from '@angular/forms';
// import { first }                                from 'rxjs/operators';

// import { RoomService, AlertService }            from '@app/_services';

// @Component({ templateUrl: 'room.add-edit.component.html' })
// export class RoomAddEditComponent implements OnInit {
//     form!:      FormGroup;
//     roomId?:    number;
//     title!:     string;
//     loading     = false;
//     submitting  = false;
//     submitted   = false;

//     constructor(
//         private formBuilder:    FormBuilder,
//         private route:          ActivatedRoute,
//         private router:         Router,
//         private RoomService:    RoomService,
//         private alertService:   AlertService
//     ) { }

//     ngOnInit() {
//         this.roomId = this.route.snapshot.params['roomId'];

//         // Define form with necessary fields
//         // this.form = this.formBuilder.group({
//         //     roomName:       ['',            [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
//         //     roomFloor:      ['',            [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
//         //     roomType:       ['unknownroom', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
//         //     stockroomType:  ['unknownType', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
//         //     roomInCharge:   [,              [Validators.required]],
//         // });
//         this.form = this.formBuilder.group({
//             roomName:      ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
//             roomFloor:     ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
//             roomType:      ['unknownroom', [Validators.required]],
//             stockroomType: ['unknownType', [Validators.required]],
//             roomInCharge:  [null, [Validators.required]]        // <-- fixed: give a default value (null)
//           });

//         this.title = 'Create Room';
//         if (this.roomId) {
//             // Edit mode
//             this.title = 'Edit Room';
//             this.loading = true;
//             this.RoomService.getRoomById(this.roomId)
//                 .pipe(first())
//                 .subscribe({
//                     next: (room) => {
//                         this.form.patchValue(room);
//                         this.loading = false;
//                     },
//                     error: () => this.loading = false
//                 });
//         }
//     }

//     // Convenience getter for easy access to form fields
//     get f() { return this.form.controls; }

//     onSubmit() {
//         this.submitted = true;

//         // Clear alerts on submit
//         this.alertService.clear();

//         // Stop here if form is invalid
//         if (this.form.invalid) {
//             return;
//         }

//         this.submitting = true;

//         // Create or update Room based on id param
//         let saveRoom;
//         let message: string;
//         if (this.roomId) {
//             saveRoom = () => this.RoomService.updateRoom(this.roomId!, this.form.value);
//             message = 'Room updated successfully';
//         } else {
//             saveRoom = () => this.RoomService.createRoom(this.form.value);
//             message = 'Room created successfully';
//         }

//         saveRoom()
//             .pipe(first())
//             .subscribe({
//                 next: () => {
//                     this.alertService.success(message, { keepAfterRouteChange: true });
//                     this.router.navigateByUrl('/rooms');
//                 },
//                 error: error => {
//                     this.alertService.error(error);
//                     this.submitting = false;
//                 }
//             });
//     }
// }


// room.add-edit.component.ts (only show relevant parts / replace ngOnInit and onSubmit if you already have them)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

import { RoomService, AlertService, AccountService }            from '@app/_services';

@Component({ templateUrl: 'room.add-edit.component.html' })
export class RoomAddEditComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  roomId?: number;
  title = 'Create Room';
  loading = false;
  submitting = false;
  submitted = false;
  inChargeOptions: any[] = [];
  showStockroomType = false;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private RoomService: RoomService,
    private accountService: AccountService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.roomId = this.route.snapshot.params['id'];

    this.form = this.formBuilder.group({
      roomName:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      roomFloor:      ['', [Validators.required]],
      roomType:       ['', Validators.required],
      stockroomType:  [null], // will become required conditionally
      roomInCharge:   [null, [Validators.required]]
    });

    // Ensure ngSubmit fires: formGroup exists and controls are set
    this.form.get('roomType')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val: string) => this.toggleStockroomTypeControl(val));

    // Load in-charge options (optional)
    this.accountService.getAll().pipe(first()).subscribe({
      next: (accounts: any[]) => this.inChargeOptions = accounts || [],
      error: () => this.inChargeOptions = []
    });

    if (this.roomId) {
      this.title = 'Edit Room';
      this.loading = true;
      this.RoomService.getRoomById(this.roomId)
        .pipe(first())
        .subscribe({
          next: (room) => {
            this.form.patchValue({
              roomName: room.roomName,
              roomFloor: room.roomFloor,
              roomType: room.roomType,
              stockroomType: room.stockroomType,
              roomInCharge: room.roomInCharge
            });
            this.toggleStockroomTypeControl(room.roomType);
            this.loading = false;
          },
          error: () => this.loading = false
        });
    } else {
      // initial toggle for default roomType
      this.toggleStockroomTypeControl(this.form.get('roomType')!.value);
    }
  }

  private toggleStockroomTypeControl(roomType: string) {
    const ctrl: AbstractControl | null = this.form.get('stockroomType');
    if (!ctrl) return;
    if (roomType === 'stockroom' || roomType === 'subStockroom') {
      this.showStockroomType = true;
      ctrl.setValidators([Validators.required]);
    } else {
      this.showStockroomType = false;
      ctrl.clearValidators();
      ctrl.setValue(null);
    }
    ctrl.updateValueAndValidity();
  }

  get f() { return this.form.controls; }

  onSubmit() {
    console.log('[RoomAddEdit] onSubmit called, submitting=', this.submitting, 'form.invalid=', this.form.invalid, 'form.value=', this.form.value);
    this.submitted = true;
    this.alertService.clear();

    // if invalid, show errors but don't proceed
    if (this.form.invalid) {
      console.log('[RoomAddEdit] form invalid -> abort submit', this.form.errors, this.form);
      return;
    }

    this.submitting = true;

    const payload = this.form.value;
    const obs$ = this.roomId ? this.RoomService.updateRoom(this.roomId, payload) : this.RoomService.createRoom(payload);

    obs$.pipe(first()).subscribe({
      next: () => {
        this.alertService.success(this.roomId ? 'Room updated' : 'Room created', { keepAfterRouteChange: true });
        this.router.navigateByUrl('/room');
      },
      error: err => {
        console.error('[RoomAddEdit] save error:', err);
        this.alertService.error(err);
        this.submitting = false;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
