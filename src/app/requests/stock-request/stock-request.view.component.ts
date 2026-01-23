import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';

import {
  AlertService,
  AccountService,
  StockRequestService
} from '@app/_services';
import {
  StockRequest,
  RequestedItem
} from '@app/_models/stock-request.model';
// ================================================================

@Component({
  templateUrl: './stock-request.view.component.html'
})
export class StockRequestViewComponent implements OnInit {
  id!: number;
  request: StockRequest | null = null;
  loading = false;
  account: any;
  requestedItemRows: Array<{ label: string; value: string | number | null }> = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private sr: StockRequestService,
    private alert: AlertService,
    private accountService: AccountService
  ) {
    this.account = this.accountService.accountValue;
  }

  private _errToString(err: any): string {
    if (!err && err !== 0) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }

  ngOnInit() {
    const paramRaw: string | null = this.route.snapshot.paramMap.get('id');
    const param: string | undefined = paramRaw ?? undefined;
    let id = Number(param);

    if (!Number.isFinite(id) || id <= 0) {
      const nav = this.router.getCurrentNavigation();
      const stateId = nav?.extras?.state?.id ?? (history.state && history.state.id);
      id = Number(stateId);
    }

    if (!Number.isFinite(id) || id <= 0) {
      this.alert.error('Invalid stock request id. Returning to list.');
      this.router.navigate(['/req-stock']);
      return;
    }

    this.id = id;
    this.load();
  }

  load() {
    this.loading = true;
    this.sr.get(this.id).pipe(first()).subscribe({
      next: (res: StockRequest) => {
        this.request = res;
        this.requestedItemRows = this.getRequestedItemDisplayRows(this.request);
        this.loading = false;
      },
      error: e => { this.alert.error(this._errToString(e)); this.loading = false; this.router.navigate(['/req-stock']); }
    });
  }

  approve() {
    if (!confirm(`Approve this request for ${this.request?.quantity} items?`)) return;
    this.sr.approve(this.id, this.request?.quantity)
      .pipe(first())
      .subscribe(() => {
        this.alert.success('Approved');
        this.load();
      }, e => this.alert.error(this._errToString(e)));
  }

  disapprove() {
    const r = prompt('Reason?') ?? undefined;
    this.sr.disapprove(this.id, r)
      .pipe(first())
      .subscribe(() => {
        this.alert.success('Disapproved'); this.load();
      }, e => this.alert.error(this._errToString(e)));
  }

  fulfill() {
    if (!confirm('Fulfill?')) return;
    this.sr.fulfill(this.id)
      .pipe(first())
      .subscribe(() => {
        this.alert.success('Fulfilled');
        this.load();
      }, e => this.alert.error(this._errToString(e)));
  }

  isAdmin() { return this.account?.role === 'superAdmin' || this.account?.role === 'admin'; }
  isStockroom() { return this.account?.role === 'stockroomAdmin' || this.account?.role === 'superAdmin'; }

  goBack() { this.router.navigate(['/req-stock']); }

  private _stringify(val: any): string {
    if (val === null || typeof val === 'undefined') return '—';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) return val.map(v => this._stringify(v)).join(', ');
    try { return JSON.stringify(val, null, 0); } catch { return String(val); }
  }

  getRequestedItemDisplayRows(request: any): Array<{ label: string; value: string | number | null }> {
    if (!request) return [];

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
        rows.push({ label: 'Specific Type', value: inv.genItemType || type });
        rows.push({ label: 'Size/Spec', value: inv.genItemSize });
      }

      rows.push({ label: 'Current Inventory Stock', value: inv.totalQuantity ?? inv.supplyQuantity ?? inv.quantity ?? '0' });
      rows.push({ label: 'Database ID', value: inv.apparelInventoryId || inv.adminSupplyInventoryId || inv.genItemInventoryId || inv.id });

      return rows;
    }

    // Case 2: New Item Request ("Other")
    if (request.otherItemName) {
      rows.push({ label: 'Requested New Item', value: request.otherItemName });
      rows.push({ label: 'Proposed Category', value: request.itemType });

      if (request.details) {
        Object.keys(request.details).forEach(k => {
          const val = request.details[k];
          if (val) {
            rows.push({ label: this._niceLabel(k), value: this._stringify(val) });
          }
        });
      }
      return rows;
    }

    // Case 3: Unit record fallback
    if (ri && ri.kind === 'unit' && ri.unit) {
      const unit: any = ri.unit;
      rows.push({ label: 'Unit ID', value: unit.id ?? unit.apparelId ?? '—' });
      rows.push({ label: 'Status', value: unit.status ?? '—' });
      return rows;
    }

    return rows;
  }

  private _normalizeLabelKey(s: string) {
    return String(s || '').toLowerCase().replace(/\s+/g, '');
  }

  private _niceLabel(k: string) {
    if (!k) return k;
    // Special cleanup for common keys
    let filtered = k;
    const prefixes = ['apparel', 'genitem', 'item', 'supply', 'admin'];
    prefixes.forEach(p => {
      if (filtered.toLowerCase().startsWith(p)) {
        filtered = filtered.substring(p.length);
      }
    });

    // convert camelCase / snake_case to Title Case
    const spaced = filtered.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-]+/g, ' ').trim();
    if (!spaced) return k; // if we filtered everything out, return original

    return spaced.split(' ').map(p => p[0]?.toUpperCase() + p.slice(1)).join(' ');
  }
}
