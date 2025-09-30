import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { RoomService, AlertService } from '@app/_services';
import { AccountService } from '@app/_services';

type Option = { value: string, label: string };

@Component({
  templateUrl: './gen-item-receive.component.html'
})
export class GenItemReceiveComponent implements OnInit {
  roomId = NaN;
  receiveForm!: FormGroup;
  submitting = false;

  currentUserName: string | null = null;
  currentUserId: number | null = null;

  // ENUM-like option lists — replace values with the exact enum values backend expects

  genItemTypes: Option[] = [
    { value: 'it',          label: 'IT Dept.' },
    { value: 'maintenance', label: 'Maintenance Dept.' },
    { value: 'unknownType', label: 'Unknown' },
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

    // 1) Try to get user from injected accountService (if provided)
    if (this.accountService) {
      const svc: any = this.accountService as any;
      // try several common property names used by different templates
      user = svc?.currentUserValue || svc?.userValue || svc?.value || svc?.getValue?.();
      // also support an observable getter (less likely in this simple snippet)
      if (!user && typeof svc?.getCurrentUser === 'function') {
        user = svc.getCurrentUser();
      }
    }

    // 2) Fallback: try localStorage (older/simple auth implementations)
    if (!user) {
      try {
        const raw = localStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('account');
        if (raw) user = JSON.parse(raw);
      } catch (err) {
        // silent fallback
      }
    }

    // If we found a user, normalize id & name
    if (user) {
      // customize these property names if your user object uses different keys
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
        // patch the numeric id into the form control so backend gets it
        this.receiveForm.patchValue({ receivedBy: this.currentUserId });
      }
      if (name) {
        this.currentUserName = name;
      }
    }
  }

  private buildForm() {
    //const currentUserId = this.getCurrentUserId;
    this.receiveForm = this.fb.group({
      genItemName:      ['', Validators.required],
      genItemSize:      ['', Validators.required],
      genItemQuantity:  [1, [Validators.required, Validators.min(1)]],
      genItemType:      [this.genItemTypes[0].value, Validators.required],
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
        this.alert.success('Received general items successfully');
        this.submitting = false;
        this.router.navigate(['../', '..', 'inventory', 'general'], { relativeTo: this.route });
      },
      error: (e) => { this.alert.error(e); this.submitting = false; }
    });
  }
}
