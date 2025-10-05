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
export class ApparelReceiveComponent implements OnInit {
  roomId = NaN;
  receiveForm!: FormGroup;
  submitting = false;

  currentUserName: string | null = null;
  currentUserId: number | null = null;

  // ENUM-like option lists — replace values with the exact enum values backend expects

  apparelLevels: Option[] = [
    { value: 'pre',       label: 'Pre-School' },
    { value: 'elem',      label: 'Elementary' },
    { value: '7',         label: 'Grade 7' },
    { value: '8',         label: 'Grade 8' },
    { value: '9',         label: 'Grade 9' },
    { value: '10',        label: 'Grade 10' },
    { value: 'hs',        label: 'Junior High Shool' },
    { value: 'sh',        label: 'Senior High School' },
    { value: 'it',        label: 'BSIT' },
    { value: 'educ',      label: 'EDUC' },
    { value: 'teachers',  label: 'Teachers' }
  ];

  apparelTypes: Option[] = [
    { value: 'uniform', label: 'Uniform' },
    { value: 'pe',      label: 'PE' }
  ];

  apparelForOptions: Option[] = [
    { value: 'boys',  label: 'Boys' },
    { value: 'girls', label: 'Girls' }
  ];

  apparelSizes: Option[] = [
    { value: '2',   label: '2' },
    { value: '4',   label: '4' },
    { value: '6',   label: '6' },
    { value: '8',   label: '8' },
    { value: '10',  label: '10' },
    { value: '12',  label: '12' },
    { value: '14',  label: '14' },
    { value: '16',  label: '16' },
    { value: '18',  label: '18' },
    { value: '20',  label: '20' },
    { value: 'xs',  label: 'XS' },
    { value: 's',   label: 'S' },
    { value: 'm',   label: 'M' },
    { value: 'l',   label: 'L' },
    { value: 'xl',  label: 'XL' },
    { value: '2xl', label: '2XL' },
    { value: '3xl', label: '3XL' }
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
      apparelName:      ['', Validators.required],
      apparelLevel:     [this.apparelLevels[0].value, Validators.required], // default to first
      apparelType:      [this.apparelTypes[0].value, Validators.required],
      apparelFor:       [this.apparelForOptions[0].value, Validators.required], // default 'unisex'
      apparelSize:      [this.apparelSizes[0].value, Validators.required], // default 'M'
      apparelQuantity:  [1, [Validators.required, Validators.min(1)]],
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
        this.alert.success('Received apparel successfully');
        this.submitting = false;
        this.router.navigate(['../', '..', 'inventory', 'apparel'], { relativeTo: this.route });
      },
      error: (e) => { this.alert.error(e); this.submitting = false; }
    });
  }
}
