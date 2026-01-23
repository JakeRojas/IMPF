import { Component, OnInit } from '@angular/core';
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
  requestedItemRows: Array<{ label: string; value: string | number | null }> = [];

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

  decisions: any = {}; // id -> { status, reason }

  get hasDecisions(): boolean {
    return Object.keys(this.decisions).length > 0;
  }

  load() {
    this.loading = true;
    this.ir.get(this.id).pipe(first()).subscribe({
      next: (r) => {
        this.request = r;
        this.requestedItemRows = this.getRequestedItemDisplayRows(this.request);
        this.loading = false;
      },
      error: e => { this.alert.error(this._errToString(e)); this.loading = false; this.router.navigate(['/req-item']); }
    });
  }

  getItemName(item: any): string {
    if (item.otherItemName) return item.otherItemName;
    const ri = item.requestedItem;
    if (ri && ri.inventory) {
      const inv = ri.inventory;
      return inv.apparelName || inv.supplyName || inv.genItemName || inv.name || ('Item #' + item.itemId);
    }
    return 'Item #' + item.itemId;
  }

  toggleItemAccept(item: any) {
    if (this.decisions[item.itemRequestDetailId]?.status === 'accepted') {
      delete this.decisions[item.itemRequestDetailId];
    } else {
      this.decisions[item.itemRequestDetailId] = { status: 'accepted', reason: '' };
    }
  }

  toggleItemDecline(item: any) {
    if (this.decisions[item.itemRequestDetailId]?.status === 'declined') {
      delete this.decisions[item.itemRequestDetailId];
    } else {
      const reason = prompt(`Reason for declining "${this.getItemName(item)}"?`);
      if (reason !== null) {
        this.decisions[item.itemRequestDetailId] = { status: 'declined', reason };
      }
    }
  }

  accept() {
    const dArray = Object.keys(this.decisions).map(id => ({
      id: Number(id),
      status: this.decisions[id].status,
      reason: this.decisions[id].reason
    }));

    if (dArray.length > 0) {
      if (!confirm(`Submit decisions for ${dArray.length} selected item(s)?`)) return;
      this.ir.accept(this.id, { decisions: dArray }).pipe(first()).subscribe(() => {
        this.alert.success('Item decisions submitted');
        this.decisions = {};
        this.load();
      }, e => this.alert.error(this._errToString(e)));
    } else {
      if (!confirm(`Accept this entire request for ${this.request?.quantity} unit(s)?`)) return;
      this.ir.accept(this.id, { quantity: this.request?.quantity }).pipe(first()).subscribe(() => {
        this.alert.success('Entire request accepted');
        this.load();
      }, e => this.alert.error(this._errToString(e)));
    }
  }

  decline() {
    const reason = prompt('Decline entire request? Reason:') ?? undefined;
    if (reason === undefined) return;
    this.ir.decline(this.id, reason).pipe(first()).subscribe(() => {
      this.alert.success('Request declined');
      this.load();
    }, e => this.alert.error(this._errToString(e)));
  }

  fulfill() {
    if (!confirm('Fulfill this request?')) return;
    this.ir.fulfill(this.id).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Fulfilled');
        const roomId = Number(this.request?.requesterRoomId);
        const itemType = (this.request?.itemType || '').toString().toLowerCase();
        let stockPath = 'general';
        if (itemType.includes('apparel')) stockPath = 'apparel';
        else if (itemType.includes('supply') || itemType.includes('admin')) stockPath = 'supply';

        if (Number.isFinite(roomId) && roomId > 0) {
          this.router.navigate(['/room', roomId, 'units', stockPath]);
        } else {
          this.load();
        }
      },
      error: e => this.alert.error(this._errToString(e))
    });
  }

  isAdmin() { return this.account?.role === 'superAdmin' || this.account?.role === 'admin'; }
  isStockroom() { return this.account?.role === 'stockroomAdmin' || this.account?.role === 'superAdmin'; }
  isTeacher() { return this.account?.role === 'teacher' || this.account?.role === 'roomInCharge' || this.account?.role === 'user'; }

  goBack() { this.router.navigate(['/req-item']); }

  private stringify(val: any): string {
    if (val === null || typeof val === 'undefined') return '—';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) return val.map(v => this.stringify(v)).join(', ');
    try { return JSON.stringify(val, null, 0); } catch { return String(val); }
  }

  getRequestedItemDisplayRows(request: any): Array<{ label: string; value: string | number | null }> {
    if (!request) return [];

    // In item requests, requestedItem might not be explicitly loaded yet from the same helper
    // but the row has itemType/itemId/otherItemName/details
    const ri = request.requestedItem;
    const rows: Array<{ label: string; value: any }> = [];

    // Case 1: Existing Inventory Item
    if (ri && ri.kind === 'inventory' && ri.inventory) {
      const inv: any = ri.inventory;
      const type = (ri.type || '').toLowerCase();

      if (type.includes('apparel')) {
        rows.push({ label: 'Item Name', value: inv.apparelName || inv.name });
        rows.push({ label: 'Level/Department', value: inv.apparelLevel });
        rows.push({ label: 'Apparel Type', value: inv.apparelType });
        rows.push({ label: 'For', value: inv.apparelFor });
        rows.push({ label: 'Size', value: inv.apparelSize });
      } else if (type.includes('supply')) {
        rows.push({ label: 'Item Name', value: inv.supplyName || inv.name });
        rows.push({ label: 'Measurement', value: inv.supplyMeasure });
      } else {
        rows.push({ label: 'Item Name', value: inv.genItemName || inv.name });
        rows.push({ label: 'Item Type', value: inv.genItemType || type });
        rows.push({ label: 'Size/Spec', value: inv.genItemSize });
      }

      rows.push({ label: 'Current Inventory Stock', value: inv.totalQuantity ?? inv.supplyQuantity ?? inv.quantity ?? '0' });
      return rows.filter(r => r.value !== undefined && r.value !== null);
    }

    // Case 2: New Item Request ("Other")
    if (request.otherItemName) {
      rows.push({ label: 'Requested New Item', value: request.otherItemName });
      rows.push({ label: 'Proposed Category', value: request.itemType });

      if (request.details) {
        Object.keys(request.details).forEach(k => {
          const val = request.details[k];
          if (val) rows.push({ label: this._niceLabel(k), value: this.stringify(val) });
        });
      }
      return rows;
    }

    // Fallback info
    if (request.itemType) {
      rows.push({ label: 'Requested Type', value: request.itemType });
      rows.push({ label: 'Quantity', value: request.quantity });
    }

    return rows;
  }

  private _niceLabel(k: string) {
    if (!k) return k;
    let filtered = k;
    const prefixes = ['apparel', 'genitem', 'item', 'supply', 'admin'];
    prefixes.forEach(p => {
      if (filtered.toLowerCase().startsWith(p)) {
        filtered = filtered.substring(p.length);
      }
    });
    const spaced = filtered.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-]+/g, ' ').trim();
    if (!spaced) return k;
    return spaced.split(' ').map(p => p[0]?.toUpperCase() + p.slice(1)).join(' ');
  }
}
