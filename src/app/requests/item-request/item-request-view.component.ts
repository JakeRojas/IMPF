import { Component, OnInit      } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { 
  AlertService, 
  AccountService, 
  ItemRequestService 
} from '@app/_services';
import { ItemRequest } from '@app/_models/item-request.model';
// ==============================================================

@Component({ 
  templateUrl: './item-request-view.component.html' 
})
export class ItemRequestViewComponent implements OnInit {
  id!: number;
  request: ItemRequest | null = null;
  loading = false;
  account: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ir: ItemRequestService,
    private alert: AlertService,
    private accountService: AccountService
  ) {
    this.account = this.accountService.accountValue;
  }

  private _errToString(err: any) {
    if (!err && err !== 0) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.error?.message) return String(err.error.message);
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }

  ngOnInit() {
    const param = this.route.snapshot.paramMap.get('id') ?? undefined;
    let id = Number(param);
    if (!Number.isFinite(id) || id <= 0) {
      this.alert.error('Invalid item request id'); this.router.navigate(['/req-item']); return;
    }
    this.id = id;
    this.load();
  }

  load() {
    this.loading = true;
    this.ir.get(this.id).pipe(first()).subscribe({
      next: (r) => {
        if (r && !Array.isArray(r.items)) {
          r.items = (r.itemId || r.itemType || r.quantity)
            ? [{
                itemId: r.itemId ?? null,
                quantity: Number(r.quantity) || 0,
                note: r.note ?? null
              }]
            : [];
        }
    
        this.request = r;
        this.loading = false;
      },
      error: e => { this.alert.error(this._errToString(e)); this.loading = false; this.router.navigate(['/req-item']); }
    });
  }

  accept() { 
    if (!confirm('Accept?')) 
    return; 
      this.ir.accept(this.id)
        .pipe(first())
        .subscribe(() => { 
          this.alert.success('Accepted'); 
          this.load(); 
        }, e => this.alert.error(this._errToString(e))); 
  }
  decline() {
    const reason = prompt('Reason?') ?? undefined; 
    this.ir.decline(this.id, reason)
      .pipe(first())
      .subscribe(() => { 
        this.alert.success('Declined'); 
        this.load(); 
      }, e => this.alert.error(this._errToString(e))); 
  }
  // fulfill() { 
  //   if (!confirm('Fulfill?')) 
  //   return; 
  //     this.ir.fulfill(this.id)
  //       .pipe(first())
  //       .subscribe(() => { 
  //     this.alert.success('Fulfilled'); 
  //     this.load(); 
  //   }, e => this.alert.error(this._errToString(e))); 
  // }
  fulfill() {
    if (!confirm('Fulfill?')) return;
  
    this.ir.fulfill(this.id)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alert.success('Fulfilled');
  
          // If we have a requester room id, navigate to its unit list so the user can see the units
          const roomId = Number(this.request?.requesterRoomId ?? this.request?.requesterRoom ?? NaN);
          const itemType = (this.request?.itemType || '').toString().toLowerCase();
  
          let stockPath = 'general';
          if (itemType.indexOf('apparel') !== -1) stockPath = 'apparel';
          else if (itemType.indexOf('supply') !== -1 || itemType.indexOf('admin') !== -1) stockPath = 'supply';
  
          if (Number.isFinite(roomId) && roomId > 0) {
            // navigate to e.g. /room/123/units/apparel
            this.router.navigate(['/room', roomId, 'units', stockPath]);
          } else {
            // fallback: reload this view (so request status updates)
            this.load();
          }
        },
        error: e => this.alert.error(this._errToString(e))
      });
  }

  isStockroomAdmin() { return this.account?.role === 'stockroom' || this.account?.role === 'admin' || this.account?.role === 'superAdmin'; }
  isTeacher() { return this.account?.role === 'teacher' || this.account?.role === 'roomInCharge' || this.account?.role === 'user'; }

  goBack() { this.router.navigate(['/req-item']); }
}
