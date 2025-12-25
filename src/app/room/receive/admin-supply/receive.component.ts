import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { RoomService, AlertService } from '@app/_services';
import { AccountService } from '@app/_services';

type Option = { value: string, label: string };

@Component({
  templateUrl: './receive.component.html'
})
export class AdminSupplyReceiveComponent implements OnInit {
  roomId = NaN;
  receiveForm!: FormGroup;
  submitting = false;

  currentUserName: string | null = null;
  currentUserId: number | null = null;

  supplyMeasures: Option[] = [
    { value: 'pc',      label: 'pc/s' },
    { value: 'box',     label: 'box/s' },
    { value: 'bottle',  label: 'bottle/s' },
    { value: 'pack',    label: 'pack/s' },
    { value: 'ream',    label: 'ream/s' },
    { value: 'meter',   label: 'meter/s' },
    { value: 'roll',    label: 'roll/s' },
    { value: 'gallon',  label: 'gallon/s' },
    { value: 'unit',    label: 'unit/s' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService,
    private alert: AlertService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.roomId = this.findRoomId(this.route);
    this.buildForm();
    this.tryFillCurrentUser();
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

  private tryFillCurrentUser() {
    let user: any = null;

    if (this.accountService) {
      const svc: any = this.accountService as any;
      user = svc?.currentUserValue || svc?.userValue || svc?.value || svc?.getValue?.();
      if (!user && typeof svc?.getCurrentUser === 'function') {
        user = svc.getCurrentUser();
      }
    }

    if (!user) {
      try {
        const raw = localStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('account');
        if (raw) user = JSON.parse(raw);
      } catch (err) {
      }
    }

    if (user) {
      const id = user?.id ?? user?.accountId ?? user?.userId ?? user?.uid;
      const name =
        user?.fullName ??
        (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ??
        user?.name ??
        user?.username ??
        user?.email ??
        null;

      if (id) {
        this.currentUserId = +id;
        this.receiveForm.patchValue({ receivedBy: this.currentUserId });
      }
      if (name) {
        this.currentUserName = name;
      }
    }
  }

  private buildForm() {
    this.receiveForm = this.fb.group({
      supplyName:       ['', Validators.required],
      supplyQuantity:   [1, [Validators.required, Validators.min(1)]],
      supplyMeasure:    [this.supplyMeasures[0].value, Validators.required],
      receivedFrom:     ['', Validators.required],
      receivedBy:       [null, Validators.required],
      notes:            ['']
    });
  }

  submit() {
    if (this.receiveForm.invalid) { this.alert.error('Please fill required fields'); return; }
    this.submitting = true;
    const payload = this.receiveForm.value;

    this.roomService.receiveItem(this.roomId, payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Received admin supply successfully');
        this.submitting = false;
        this.router.navigate(['../', '..', 'inventory', 'supply'], { relativeTo: this.route });
      },
      error: (e) => { this.alert.error(e); this.submitting = false; }
    });
  }
}
