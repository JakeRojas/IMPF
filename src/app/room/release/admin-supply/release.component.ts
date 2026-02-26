import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService, AlertService, AccountService } from '@app/_services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './release.component.html'
})
export class AdminSupplyReleaseComponent implements OnInit {
  roomId = NaN;
  inventory: any[] = [];
  releaseForm!: FormGroup;
  submitting = false;

  currentUserName: string | null = null;
  currentUserId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private roomService: RoomService,
    private alert: AlertService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.roomId = this.findRoomId(this.route);
    this.releaseForm = this.fb.group({
      adminSupplyInventoryId: [null, Validators.required],
      releaseQuantity: [1, [Validators.required, Validators.min(1)]],
      claimedBy: ['', Validators.required],
      releasedBy: ['', Validators.required],
      remarks: ['']
    });

    this.tryFillCurrentUser();
    this.loadInventory();
  }

  private tryFillCurrentUser() {
    const user = this.accountService.accountValue;
    if (user) {
      const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || user.email || '');
      this.currentUserName = name;
      this.currentUserId = user.AccountId ? +user.AccountId : null;

      if (name) {
        this.releaseForm.patchValue({ releasedBy: name });
      }
    }
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
    this.roomService.getAdminSupplyInventory(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => this.inventory = res || [],
      error: (e) => this.alert.error(e)
    });
  }

  submit() {
    if (this.releaseForm.invalid) { this.alert.error('Please complete the form'); return; }
    this.submitting = true;
    const payload = this.releaseForm.value;

    this.roomService.releaseAdminSupply(this.roomId, payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Released successfully');
        this.submitting = false;
        this.router.navigate(['list'], { relativeTo: this.route });
      },
      error: (e) => { this.alert.error(e); this.submitting = false; }
    });
  }
}