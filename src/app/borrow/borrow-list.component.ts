import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BorrowService, AlertService, AccountService } from '@app/_services';
import { first, filter, take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-borrow-list',
  templateUrl: './borrow-list.component.html'
})
export class BorrowListComponent implements OnInit {
  borrows: any[] = []; // raw flat list
  groupedBorrows: any[] = []; // grouped list for display
  loading = false;

  filterStatus = '';
  account: any = null;

  // Pagination
  page = 1;
  limit = 20; // Increased limit to ensure we get enough items to group
  total = 0;
  totalPages = 0;

  searchText = '';
  selectedItemType = '';
  startDate = '';
  endDate = '';

  constructor(
    private borrowService: BorrowService,
    private alert: AlertService,
    private router: Router,
    private accountService: AccountService
  ) { }

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
    if (this.searchText) params.search = this.searchText;
    if (this.selectedItemType) params.itemType = this.selectedItemType;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;

    this.borrowService.list(params, this.page, this.limit).pipe(first()).subscribe({
      next: (res: any) => {
        this.borrows = res.data ?? [];
        if (res.meta) {
          this.total = res.meta.total;
          this.totalPages = res.meta.totalPages;
          this.page = res.meta.page;
        }
        this.groupBorrows();
        this.loading = false;
      },
      error: err => { this.alert.error(err?.message ?? err); this.loading = false; }
    });
  }

  groupBorrows() {
    // Group by status + roomId + requesterId + time (minute precision)
    const groups: any[] = [];

    this.borrows.forEach(b => {
      const dateStr = b.createdAt ? new Date(b.createdAt).toISOString().slice(0, 16) : 'unknown'; // yyyy-MM-ddTHH:mm
      const key = `${b.status}_${b.room?.roomId}_${b.requester?.accountId}_${dateStr}`;

      let group = groups.find(g => g.key === key);
      if (!group) {
        group = {
          key,
          items: [],
          // Properties for display (taken from first item)
          borrowId: b.borrowId, // Display primary ID
          room: b.room,
          requester: b.requester,
          status: b.status,
          createdAt: b.createdAt
        };
        groups.push(group);
      }
      group.items.push(b);
    });

    this.groupedBorrows = groups;
  }

  onFilterChange() {
    this.page = 1;
    this.load();
  }

  clearFilters() {
    this.filterStatus = '';
    this.searchText = '';
    this.selectedItemType = '';
    this.startDate = '';
    this.endDate = '';
    this.load();
  }

  onPageChange(page: number) {
    this.page = page;
    this.load();
  }

  range(start: number, end: number): number[] {
    return [...Array(end - start + 1).keys()].map(i => i + start);
  }

  goCreate() { this.router.navigate(['/borrow/create']); }

  view(groupOrItem: any) {
    // For view, we just link to the first item for now. 
    // Ideally the View page would show sibling items.
    const item = groupOrItem.items ? groupOrItem.items[0] : groupOrItem;
    const id = item?.borrowId ?? item?.id;
    if (id) this.router.navigate(['/borrow', id]);
    else this.alert.info(JSON.stringify(item, null, 2));
  }

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
    const item = b.items ? b.items[0] : b;
    const requesterCandidates = [
      item?.requester?.accountId,
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
    const item = b.items ? b.items[0] : b;
    if (!item) return null;

    // Primitive candidates
    const candidates = [
      item?.room?.roomInCharge,
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
    const item = b.items ? b.items[0] : b;
    return String(item?.status ?? '').toLowerCase() === 'waiting_for_approval' && (this.isRoomInCharge(b) || this.isSuperAdmin());
  }

  showAcquireCancel(b: any): boolean {
    const item = b.items ? b.items[0] : b;
    return String(item?.status ?? '').toLowerCase() === 'approved' && this.isRequester(b);
  }
  showReturnButton(b: any): boolean {
    const item = b.items ? b.items[0] : b;
    return String(item?.status ?? '').toLowerCase() === 'acquired' && this.isRequester(b);
  }
  showAcceptReturn(b: any): boolean {
    const item = b.items ? b.items[0] : b;
    return String(item?.status ?? '').toLowerCase() === 'in_return' && (this.isRoomInCharge(b) || this.isSuperAdmin());
  }

  // --- ACTIONS (Bulk) ---

  private getIds(groupOrItem: any): number[] {
    if (groupOrItem.items && Array.isArray(groupOrItem.items)) {
      return groupOrItem.items.map((i: any) => Number(i.borrowId ?? i.id)).filter((id: number) => !isNaN(id));
    }
    const id = Number(groupOrItem.borrowId ?? groupOrItem.id);
    return isNaN(id) ? [] : [id];
  }

  approve(b: any) {
    if (!confirm('Approve this borrow request?')) return;
    const ids = this.getIds(b);
    if (!ids.length) return this.alert.error('Missing id');

    this.loading = true;
    forkJoin(ids.map(id => this.borrowService.approve(id))).pipe(first()).subscribe({
      next: () => { this.alert.success('Borrow(s) approved'); this.load(); },
      error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
    });
  }

  decline(b: any) {
    const reason = prompt('Reason for declining (optional):') || undefined;
    if (!confirm('Decline this borrow request?')) return;
    const ids = this.getIds(b);
    if (!ids.length) return this.alert.error('Missing id');

    this.loading = true;
    forkJoin(ids.map(id => this.borrowService.decline(id, reason))).pipe(first()).subscribe({
      next: () => { this.alert.success('Borrow(s) declined'); this.load(); },
      error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
    });
  }

  acquire(b: any) {
    if (!confirm('Mark item(s) as acquired?')) return;
    const ids = this.getIds(b);
    if (!ids.length) return this.alert.error('Missing id');

    this.loading = true;
    forkJoin(ids.map(id => this.borrowService.acquire(id))).pipe(first()).subscribe({
      next: () => { this.alert.success('Marked as acquired'); this.load(); },
      error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
    });
  }

  cancel(b: any) {
    if (!confirm('Cancel this borrow request?')) return;
    const ids = this.getIds(b);
    if (!ids.length) return this.alert.error('Missing id');

    this.loading = true;
    forkJoin(ids.map(id => this.borrowService.cancel(id))).pipe(first()).subscribe({
      next: () => { this.alert.success('Borrow(s) cancelled'); this.load(); },
      error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
    });
  }

  markReturn(b: any) {
    if (!confirm('Mark this borrow as returned?')) return;
    const ids = this.getIds(b);
    if (!ids.length) return this.alert.error('Missing id');

    this.loading = true;
    forkJoin(ids.map(id => this.borrowService.markReturn(id))).pipe(first()).subscribe({
      next: () => { this.alert.success('Return initiated'); this.load(); },
      error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
    });
  }

  acceptReturned(b: any) {
    if (!confirm('Accept returned items?')) return;
    const ids = this.getIds(b);
    if (!ids.length) return this.alert.error('Missing id');

    this.loading = true;
    forkJoin(ids.map(id => this.borrowService.acceptReturn(id))).pipe(first()).subscribe({
      next: () => { this.alert.success('Return accepted'); this.load(); },
      error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
    });
  }
}
