import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TransferService } from '@app/_services';
import { AlertService, AccountService } from '@app/_services';
import { first } from 'rxjs/operators';
import { Transfer } from '@app/_models/transfer.model';

@Component({
  selector: 'app-transfer-list',
  templateUrl: './transfer-list.component.html'
})
export class TransferListComponent implements OnInit {
  transfers: Transfer[] = [];
  loading = false;

  // Filters
  filterStatus = '';
  searchText = '';
  selectedItemType = '';
  startDate = '';
  endDate = '';

  roomId: number | null = null;
  account: any;

  // Pagination
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  constructor(
    private transferService: TransferService,
    private accountService: AccountService,
    private alert: AlertService,
    private router: Router
  ) { }

  ngOnInit() {
    this.account = this.accountService.accountValue;
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.searchText) params.search = this.searchText;
    if (this.selectedItemType) params.itemType = this.selectedItemType;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;

    this.transferService.list(params, this.page, this.limit).pipe(first()).subscribe({
      next: (res: any) => {
        this.transfers = res.data || [];
        if (res.meta) {
          this.total = res.meta.total;
          this.totalPages = res.meta.totalPages;
          this.page = res.meta.page;
        }
        this.loading = false;
      },
      error: err => { this.alert.error(err); this.loading = false; }
    });
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
    this.page = 1;
    this.load();
  }

  onPageChange(page: number) {
    this.page = page;
    this.load();
  }

  range(start: number, end: number): number[] {
    return [...Array(end - start + 1).keys()].map(i => i + start);
  }

  goCreate() {
    this.router.navigate(['/transfers/create']);
  }

  view(t: any) {
    const id = (typeof t === 'object') ? (t?.transferId) : t;
    if (!id) {
      return this.alert?.error?.('Unable to open transfer: invalid id');
    }
    this.router.navigate(['/transfers', String(id)]);
  }

  accept(transfer: Transfer) {
    if (!confirm('Accept this transfer?')) return;
    this.transferService.accept(transfer.transferId!).pipe(first()).subscribe({
      next: () => { this.alert.success('Transfer accepted'); this.load(); },
      error: e => this.alert.error(e)
    });
  }

  receive(transfer: Transfer) {
    if (!confirm('Mark this transfer as received and update inventory?')) return;
    this.transferService.receive(transfer.transferId!).pipe(first()).subscribe({
      next: () => { this.alert.success('Transfer received successfully'); this.load(); },
      error: e => this.alert.error(e)
    });
  }

  canAccept(t: Transfer): boolean {
    if (!t) return false;
    const acct = this.account || {};

    // 1. Creator must NOT see the accept button
    if (String(t.createdBy) === String(acct.accountId)) return false;

    // 2. Status must be pending/in_transfer
    const status = String(t.status || '').toLowerCase();
    if (!['pending', 'in_transfer'].includes(status)) return false;

    // 3. Admin OR Room-in-Charge can accept
    const rawRole = acct.role ?? acct.roles ?? acct.roleName ?? '';
    const adminRoles = ['superadmin', 'admin', 'stockroomadmin', 'super_admin'];

    let isAdmin = false;
    if (Array.isArray(rawRole)) {
      isAdmin = rawRole.map((r: any) => String(r).toLowerCase()).some((r: string) => adminRoles.includes(r));
    } else {
      isAdmin = adminRoles.includes(String(rawRole).toLowerCase());
    }
    if (isAdmin) return true;

    const roomInCharge = t.toRoom?.roomInCharge ?? t.toRoomId;
    return String(acct.accountId) === String(roomInCharge);
  }

  canReceive(t: Transfer): boolean {
    if (!t) return false;
    // 1. Only accepted transfers can be received
    if (String(t.status || '').toLowerCase() !== 'transfer_accepted') return false;

    const acct = this.account || {};
    // 2. MUST only show to the one who accepted the transfer
    return String(acct.accountId) === String(t.acceptedBy);
  }
}