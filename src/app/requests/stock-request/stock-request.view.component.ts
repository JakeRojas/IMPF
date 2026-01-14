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
        this.requestedItemRows = this.getRequestedItemDisplayRows(this.request?.requestedItem);
        this.loading = false;
      },
      error: e => { this.alert.error(this._errToString(e)); this.loading = false; this.router.navigate(['/req-stock']); }
    });
  }

  // approve() { 
  //   if (!confirm('Approve?')) return; 
  //       this.sr.approve(this.id)
  //       .pipe(first())
  //       .subscribe(() => { 
  //           this.alert.success('Approved'); 
  //           this.load(); 
  //       }, e => this.alert.error(this._errToString(e))); 
  //   }
  approve() {
    // [MODIFIED] Show quantity in confirmation
    if (!confirm(`Approve this request for ${this.request?.quantity} items?`)) return;

    // [MODIFIED] Pass this.request?.quantity
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

  // ---------------- helpers for displaying requestedItem ----------------

  private _stringify(val: any): string {
    if (val === null || typeof val === 'undefined') return '—';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) return val.map(v => this._stringify(v)).join(', ');
    try { return JSON.stringify(val, null, 0); } catch { return String(val); }
  }

  getRequestedItemDisplayRows(ri?: RequestedItem | null): Array<{ label: string; value: string | number | null }> {
    if (!ri) return [];

    const rows: Array<{ label: string; value: any }> = [];

    if (ri.kind === 'inventory' && ri.inventory) {
      const inv: any = ri.inventory;

      // Apparel common fields
      if (ri.type === 'apparel') {
        rows.push({ label: 'Apparel Name', value: inv.apparelName ?? inv.name ?? inv.title ?? this._stringify(inv.id) });
        rows.push({ label: 'Apparel Level', value: inv.apparelLevel ?? '—' });
        rows.push({ label: 'Apparel Type', value: inv.apparelType ?? '—' });
        rows.push({ label: 'Apparel For', value: inv.apparelFor ?? '—' });
        rows.push({ label: 'Apparel Size', value: inv.apparelSize ?? '—' });
        rows.push({ label: 'Inventory ID', value: inv.apparelInventoryId ?? inv.id ?? '—' });
      }
      // Supply common fields
      else if (ri.type === 'supply') {
        rows.push({ label: 'Supply Name', value: inv.supplyName ?? inv.name ?? this._stringify(inv.id) });
        rows.push({ label: 'Measure', value: inv.supplyMeasure ?? '—' });
        rows.push({ label: 'Inventory ID', value: inv.adminSupplyInventoryId ?? inv.id ?? '—' });
      }
      // GenItem common fields
      else if (ri.type === 'genitem') {
        rows.push({ label: 'GenItem Name', value: inv.genItemName ?? inv.name ?? this._stringify(inv.id) });
        rows.push({ label: 'GenItem Size', value: inv.genItemSize ?? '—' });
        rows.push({ label: 'GenItem Type', value: inv.genItemType ?? '—' });
        rows.push({ label: 'Inventory ID', value: inv.genItemInventoryId ?? inv.id ?? '—' });
      } else {
        // unknown inventory type: show id & name-like fields
        rows.push({ label: 'Inventory ID', value: inv.id ?? '—' });
        rows.push({ label: 'Name', value: inv.name ?? inv.title ?? '—' });
      }

      // common inventory fields
      rows.push({ label: 'Room ID', value: inv.roomId ?? inv.room_id ?? '—' });
      rows.push({ label: 'Total Quantity', value: inv.totalQuantity ?? inv.supplyQuantity ?? inv.quantity ?? '—' });

      // show any extra keys not already shown
      const shown = new Set(rows.map(r => this._normalizeLabelKey(r.label)));
      Object.keys(inv || {}).forEach(k => {
        const keyLabel = this._niceLabel(k);
        if (!shown.has(this._normalizeLabelKey(keyLabel))) {
          rows.push({ label: keyLabel, value: this._stringify(inv[k]) });
          shown.add(this._normalizeLabelKey(keyLabel));
        }
      });

      return rows;
    }

    // -- unit record --
    if (ri.kind === 'unit' && ri.unit) {
      const unit: any = ri.unit;
      rows.push({ label: 'Unit ID', value: unit.id ?? unit.apparelId ?? '—' });
      rows.push({ label: 'Status', value: unit.status ?? '—' });
      rows.push({ label: 'Room ID', value: unit.roomId ?? '—' });
      rows.push({
        label: 'Parent Inventory FK', value:
          unit.apparelInventoryId ?? unit.adminSupplyInventoryId ?? unit.genItemInventoryId ?? '—'
      });

      // parent inventory summary (if available)
      if (ri.inventory) {
        rows.push({ label: '--- Parent Inventory ---', value: '---' });
        const inv = ri.inventory as any;
        rows.push({ label: 'Inventory ID', value: inv.id ?? inv.apparelInventoryId ?? inv.adminSupplyInventoryId ?? inv.genItemInventoryId ?? '—' });
        rows.push({ label: 'Inventory Name', value: inv.apparelName ?? inv.supplyName ?? inv.genItemName ?? inv.name ?? '—' });
        rows.push({ label: 'Inventory Qty', value: inv.totalQuantity ?? inv.supplyQuantity ?? inv.quantity ?? '—' });
      }

      // show other unit keys
      const shownU = new Set(['unit id', 'status', 'room id', 'parent inventory fk']);
      Object.keys(unit || {}).forEach(k => {
        const keyLabel = this._niceLabel(k);
        if (!shownU.has(this._normalizeLabelKey(keyLabel))) {
          rows.push({ label: keyLabel, value: this._stringify(unit[k]) });
          shownU.add(this._normalizeLabelKey(keyLabel));
        }
      });

      return rows;
    }

    // unknown kind: show raw fields
    if (ri.inventory || ri.unit) {
      const target = ri.inventory || ri.unit;
      Object.keys(target || {}).forEach(k => {
        rows.push({ label: this._niceLabel(k), value: this._stringify((target as any)[k]) });
      });
      return rows;
    }

    // fallback
    rows.push({ label: 'Type', value: ri.type ?? '—' });
    rows.push({ label: 'Kind', value: ri.kind ?? '—' });
    return rows;
  }

  private _normalizeLabelKey(s: string) {
    return String(s || '').toLowerCase().replace(/\s+/g, '');
  }

  private _niceLabel(k: string) {
    if (!k) return k;
    // convert camelCase / snake_case to Title Case
    const spaced = k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-]+/g, ' ');
    return spaced.split(' ').map(p => p[0]?.toUpperCase() + p.slice(1)).join(' ');
  }
}
