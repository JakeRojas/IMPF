import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import {
  AlertService,
  AccountService,
  StockRequestService
} from '@app/_services';
import { StockRequest } from '@app/_models';
// ============================================================

@Component({
  selector: 'app-stock-request-list',
  templateUrl: './stock-request.list.component.html'
})
export class StockRequestListComponent implements OnInit {
  requests: StockRequest[] = [];
  loading = false;
  account: any = null;

  // Pagination
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  constructor(
    private router: Router,
    private sr: StockRequestService,
    private alert: AlertService,
    private accountService: AccountService
  ) {
    this.account = this.accountService.accountValue;
  }

  ngOnInit() {
    this.load();
  }

  private _errToString(err: any): string {
    if (!err && err !== 0) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }

  load() {
    this.loading = true;
    this.sr.list({}, this.page, this.limit).pipe(first()).subscribe({
      next: (res) => {
        this.requests = res.data || [];
        if (res.meta) {
          this.total = res.meta.total;
          this.totalPages = res.meta.totalPages;
          this.page = res.meta.page;
        }
        this.loading = false;
      },
      error: err => { this.alert.error(this._errToString(err)); this.loading = false; }
    });
  }

  onPageChange(page: number) {
    this.page = page;
    this.load();
  }

  range(start: number, end: number): number[] {
    return [...Array(end - start + 1).keys()].map(i => i + start);
  }

  view(r: StockRequest) {
    const rawId = r?.stockRequestId ?? r?.id ?? r?.requestId ?? null;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      console.warn('Invalid id for stock request', r);
      this.alert.error('Cannot open request — invalid or missing id.');
      return;
    }
    this.router.navigate(['/req-stock', 'view', id]);
  }

  create() { this.router.navigate(['/req-stock', 'create']); }

  approve(r: StockRequest) {
    const id = Number(r?.stockRequestId ?? r?.id);
    if (!Number.isFinite(id)) return this.alert.error('Invalid id');
    if (!confirm('Approve this request?')) return;
    this.sr.approve(id).pipe(first()).subscribe({
      next: () => { this.alert.success('Approved'); this.load(); },
      error: e => this.alert.error(this._errToString(e))
    });
  }

  disapprove(r: StockRequest) {
    const id = Number(r?.stockRequestId ?? r?.id);
    if (!Number.isFinite(id)) return this.alert.error('Invalid id');
    const reason = prompt('Reason for disapproval (optional):') ?? undefined;
    this.sr.disapprove(id, reason).pipe(first()).subscribe({
      next: () => { this.alert.success('Disapproved'); this.load(); },
      error: e => this.alert.error(this._errToString(e))
    });
  }

  fulfill(r: StockRequest) {
    const id = Number(r?.stockRequestId ?? r?.id);
    if (!Number.isFinite(id)) return this.alert.error('Invalid id');
    if (!confirm('Fulfill this request? This will create a release batch.')) return;
    this.sr.fulfill(id).pipe(first()).subscribe({
      next: () => { this.alert.success('Fulfilled'); this.load(); },
      error: e => this.alert.error(this._errToString(e))
    });
  }

  isAdmin() { return this.account?.role === 'superAdmin' && this.account?.role === 'admin'; }
  isStockroom() { return this.account?.role === 'stockroomAdmin' }
}