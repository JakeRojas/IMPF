// // src/app/requests/stock-request/stock-request-list.component.ts
// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { first } from 'rxjs/operators';
// import { StockRequestService } from '@app/_services/stock-request.service';
// import { AlertService, AccountService } from '@app/_services';

// @Component({
//   selector: 'app-stock-request-list',
//   templateUrl: './stock-request-list.component.html'
// })
// export class StockRequestListComponent implements OnInit {
//   requests: any[] = [];
//   loading = false;
//   account: any = null;

//   constructor(
//     private router: Router,
//     private sr: StockRequestService,
//     private alert: AlertService,
//     private accountService: AccountService
//   ) {
//     this.account = this.accountService.accountValue;
//   }

//   ngOnInit() {
//     this.load();
//   }

//   load() {
//     this.loading = true;
//     this.sr.list().pipe(first()).subscribe({
//       next: (res: any) => {
//         // backend may return { data: [...] } or an array directly
//         this.requests = (res?.data || res) as any[];
//         this.loading = false;
//       },
//       error: err => { this.alert.error(err); this.loading = false; }
//     });
//   }

//   view(r: any) {
//     // try several possible id property names (defensive)
//     const rawId = r?.stockRequestId ?? r?.id ?? r?.requestId ?? r?.stock_request_id ?? null;
//     const id = Number(rawId);

//     if (!Number.isFinite(id) || id <= 0) {
//       console.warn('stock-request: invalid id for record', r);
//       this.alert.error('Cannot open request — invalid or missing id. See console for details.');
//       return;
//     }

//     // navigate to /req-stock/view/:id
//     this.router.navigate(['/req-stock', 'view', id]);
//   }

//   create() {
//     this.router.navigate(['/req-stock', 'create']);
//   }

//   approve(r: any) {
//     const id = Number(r?.stockRequestId ?? r?.id ?? r?.requestId);
//     if (!Number.isFinite(id) || id <= 0) { this.alert.error('Invalid id'); return; }
//     if (!confirm('Approve this request?')) return;
//     this.sr.approve(id).pipe(first()).subscribe({
//       next: () => { this.alert.success('Approved'); this.load(); },
//       error: e => this.alert.error(e)
//     });
//   }

//   disapprove(r: any) {
//     const id = Number(r?.stockRequestId ?? r?.id ?? r?.requestId);
//     if (!Number.isFinite(id) || id <= 0) { this.alert.error('Invalid id'); return; }
//     const reason = prompt('Reason for disapproval (optional):');
//     this.sr.disapprove(id).pipe(first()).subscribe({
//       next: () => { this.alert.success('Disapproved'); this.load(); },
//       error: e => this.alert.error(e)
//     });
//   }

//   fulfill(r: any) {
//     const id = Number(r?.stockRequestId ?? r?.id ?? r?.requestId);
//     if (!Number.isFinite(id) || id <= 0) { this.alert.error('Invalid id'); return; }
//     if (!confirm('Fulfill this request? This will create a release batch.')) return;
//     this.sr.fulfill(id).pipe(first()).subscribe({
//       next: () => { this.alert.success('Fulfilled'); this.load(); },
//       error: e => this.alert.error(e)
//     });
//   }

//   isAdmin() { return this.account?.role === 'superAdmin' || this.account?.role === 'admin'; }
//   isStockroom() { return this.account?.role === 'admin' || this.account?.role === 'superAdmin'; }
// }


// src/app/stock-request/stock-request-list.component.ts
// src/app/requests/stock-request/stock-request-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { StockRequestService } from '@app/_services/stock-request.service';
import { AlertService, AccountService } from '@app/_services';
import { StockRequest } from '@app/_models/stock-request.model';

@Component({
  selector: 'app-stock-request-list',
  templateUrl: './stock-request-list.component.html'
})
export class StockRequestListComponent implements OnInit {
  requests: StockRequest[] = [];
  loading = false;
  account: any = null;

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
    this.sr.list().pipe(first()).subscribe({
      next: (res: StockRequest[]) => { this.requests = res || []; this.loading = false; },
      error: err => { this.alert.error(this._errToString(err)); this.loading = false; }
    });
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

  isAdmin() { return this.account?.role === 'superAdmin' || this.account?.role === 'admin'; }
  isStockroom() { return this.account?.role === 'admin' || this.account?.role === 'superAdmin'; }
}
