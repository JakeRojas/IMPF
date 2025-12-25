import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BorrowService, AlertService, AccountService } from '@app/_services';
import { first, filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-borrow-list',
  templateUrl: './borrow-list.component.html'
})
export class BorrowListComponent implements OnInit {
  borrows: any[] = [];
  loading = false;
  filterStatus = '';
  account: any = null;

  constructor(
    private borrowService: BorrowService,
    private alert: AlertService,
    private router: Router,
    private accountService: AccountService
  ) {}

  ngOnInit() {
    const acct = this.accountService.accountValue;
    if (acct) { this.account = acct; this.load(); return; }
    this.accountService.account.pipe(filter((a: any) => !!a), take(1)).subscribe((a: any) => {
      this.account = a; this.load();
    });
  }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    this.borrowService.list(params).pipe(first()).subscribe({
      next: rows => { this.borrows = rows ?? []; this.loading = false; },
      error: err => { this.alert.error(err?.message ?? err); this.loading = false; }
    });
  }

  goCreate() { this.router.navigate(['/borrows/create']); }
  view(b: any) { const id = b?.borrowId ?? b?.id; if (id) this.router.navigate(['/borrows', id]); else this.alert.info(JSON.stringify(b, null, 2)); }

  private myAccountId(): string {
    return String(
      this.account?.accountId
    );
  }

  /** Robust super-admin check (case-insensitive, supports array or string role shapes) */
  isSuperAdmin(): boolean {
    const role = this.account?.role ?? this.account?.roles ?? this.account?.roleName;
    if (!role) return false;
    if (Array.isArray(role)) {
      return role.some((r: any) => String(r).toLowerCase() === 'superadmin');
    }
    return String(role).toLowerCase() === 'superadmin';
  }

  /** Resolve requester id from a borrow object (many shapes) */
  isRequester(b: any): boolean {
    const requesterCandidates = [
      b?.requester?.accountId,
    ];
    for (const c of requesterCandidates) {
      if (c !== undefined && c !== null && String(c) !== '') {
        return this.myAccountId() === String(c);
      }
    }
    return false;
  }

  /** Get room-in-charge id from many possible shapes */
  private resolveRoomInChargeId(b: any): string | null {
    if (!b) return null;

    // Primitive candidates
    const candidates = [
      b?.room?.roomInCharge,
    ];

    for (const c of candidates) {
      if (c !== undefined && c !== null && String(c) !== '') return String(c);
    }

    return null;
  }

  /** True if current user is room-in-charge for this borrow */
  isRoomInCharge(b: any): boolean {
    const myId = this.myAccountId();
    if (!myId) return false;
    const roomInChargeId = this.resolveRoomInChargeId(b);
    if (!roomInChargeId) return false;
    return myId === String(roomInChargeId);
  }

  /** Show approve/decline when waiting_for_approval and user is room-in-charge OR superadmin */
  showApproveDecline(b: any): boolean {
    return String(b?.status ?? '').toLowerCase() === 'waiting_for_approval' && (this.isRoomInCharge(b) || this.isSuperAdmin());
  }

  showAcquireCancel(b: any): boolean { return String(b?.status ?? '').toLowerCase() === 'approved' && this.isRequester(b); }
  showReturnButton(b: any): boolean { return String(b?.status ?? '').toLowerCase() === 'acquired' && this.isRequester(b); }
  showAcceptReturn(b: any): boolean { return String(b?.status ?? '').toLowerCase() === 'in_return' && (this.isRoomInCharge(b) || this.isSuperAdmin()); }

  approve(b: any) {
    if (!confirm('Approve this borrow request?')) return;
    const id = b?.borrowId ?? b?.id;
    if (!id) return this.alert.error('Missing id');
    this.borrowService.approve(id).pipe(first()).subscribe({
      next: () => { this.alert.success('Borrow approved'); this.load(); },
      error: e => this.alert.error(e?.message ?? e)
    });
  }

  decline(b: any) {
    const reason = prompt('Reason for declining (optional):') || undefined;
    if (!confirm('Decline this borrow request?')) return;
    const id = b?.borrowId ?? b?.id;
    if (!id) return this.alert.error('Missing id');
    this.borrowService.decline(id, reason).pipe(first()).subscribe({
      next: () => { this.alert.success('Borrow declined'); this.load(); },
      error: e => this.alert.error(e?.message ?? e)
    });
  }

  acquire(b: any) {
    if (!confirm('Mark item as acquired?')) return;
    const id = b?.borrowId ?? b?.id;
    if (!id) return this.alert.error('Missing id');
    this.borrowService.acquire(id).pipe(first()).subscribe({
      next: () => { this.alert.success('Marked as acquired'); this.load(); },
      error: e => this.alert.error(e?.message ?? e)
    });
  }

  cancel(b: any) {
    if (!confirm('Cancel this borrow request?')) return;
    const id = b?.borrowId ?? b?.id;
    if (!id) return this.alert.error('Missing id');
    this.borrowService.cancel(id).pipe(first()).subscribe({
      next: () => { this.alert.success('Borrow cancelled'); this.load(); },
      error: e => this.alert.error(e?.message ?? e)
    });
  }

  markReturn(b: any) {
    if (!confirm('Mark this borrow as returned?')) return;
    const id = b?.borrowId ?? b?.id;
    if (!id) return this.alert.error('Missing id');
    this.borrowService.markReturn(id).pipe(first()).subscribe({
      next: () => { this.alert.success('Return initiated'); this.load(); },
      error: e => this.alert.error(e?.message ?? e)
    });
  }

  acceptReturned(b: any) {
    if (!confirm('Accept returned items?')) return;
    const id = b?.borrowId ?? b?.id;
    if (!id) return this.alert.error('Missing id');
    this.borrowService.acceptReturn(id).pipe(first()).subscribe({
      next: () => { this.alert.success('Return accepted'); this.load(); },
      error: e => this.alert.error(e?.message ?? e)
    });
  }
}
