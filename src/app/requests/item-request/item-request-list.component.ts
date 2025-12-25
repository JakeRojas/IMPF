import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { 
  AlertService, 
  AccountService, 
  ItemRequestService 
} from '@app/_services';
import { ItemRequest } from '@app/_models/item-request.model';
// ==============================================================

@Component({
  templateUrl: './item-request-list.component.html'
})
export class ItemRequestListComponent implements OnInit {
  requests: ItemRequest[] = [];
  loading = false;
  account: any;

  constructor(
    private router: Router,
    private ir: ItemRequestService,
    private alert: AlertService,
    private accountService: AccountService
  ) {
    this.account = this.accountService.accountValue;
  }

  ngOnInit() { 
    this.load(); 
  }

  private _errToString(err: any) {
    if (!err && err !== 0) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.message) return String(err.message);
    if (err?.error?.message) return String(err.error.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }

  load() {
    this.loading = true;
    this.ir.list().pipe(first()).subscribe({
      next: (res) => { this.requests = res || []; this.loading = false; },
      error: e => { this.alert.error(this._errToString(e)); this.loading = false; }
    });
  }

  view(r: ItemRequest) {
    const rid = Number(r?.itemRequestId ?? r?.id);
    if (!Number.isFinite(rid) || rid <= 0) return this.alert.error('Invalid id');
    this.router.navigate(['/req-item', 'view', rid]);
  }

  create() { this.router.navigate(['/req-item','create']); }

  accept(r: ItemRequest) {
    const id = Number(r?.itemRequestId ?? r?.id);
    if (!Number.isFinite(id)) return this.alert.error('Invalid id');
    if (!confirm('Accept this item request?')) return;
    this.ir.accept(id).pipe(first()).subscribe({ next: () => { this.alert.success('Accepted'); this.load(); }, error: e => this.alert.error(this._errToString(e)) });
  }

  decline(r: ItemRequest) {
    const id = Number(r?.itemRequestId ?? r?.id);
    if (!Number.isFinite(id)) return this.alert.error('Invalid id');
    const reason = prompt('Reason for decline (optional):') ?? undefined;
    this.ir.decline(id, reason).pipe(first()).subscribe({ next: () => { this.alert.success('Declined'); this.load(); }, error: e => this.alert.error(this._errToString(e)) });
  }

  release(r: ItemRequest) {
    const id = Number(r?.itemRequestId ?? r?.id);
    if (!Number.isFinite(id)) return this.alert.error('Invalid id');
  
    this.ir.get(id).pipe(first()).subscribe({
      next: (fresh) => {
        if (!fresh) return this.alert.error('Request not found on server');
        if (fresh.status !== 'accepted') {
          return this.alert.error(`Cannot release — request status is '${fresh.status}'. Only 'accepted' requests can be released.`);
        }
  
        if (!confirm('Release this accepted item request?')) return;
        this.ir.release(id).pipe(first()).subscribe({
          next: () => { this.alert.success('Released'); this.load(); },
          error: e => this.alert.error(this._errToString(e))
        });
      },
      error: e => this.alert.error(this._errToString(e))
    });
  }

  fulfill(r: ItemRequest) {
    const id = Number(r?.itemRequestId ?? r?.id);
    if (!Number.isFinite(id)) return this.alert.error('Invalid id');
    if (!confirm('Fulfill this item request?')) return;
    this.ir.fulfill(id).pipe(first()).subscribe({ next: () => { this.alert.success('Fulfilled'); this.load(); }, error: e => this.alert.error(this._errToString(e)) });
  }

  isStockroomAdmin() { return this.account?.role === 'stockroomAdmin' || this.account?.role === 'admin' || this.account?.role === 'superAdmin'; }
  isTeacher() { return this.account?.role === 'teacher' || this.account?.role === 'roomInCharge' || this.account?.role === 'user'; }
  isSuperAdmin() { return this.account?.role === 'superAdmin'; }
}
