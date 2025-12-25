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
  filterStatus = '';
  roomId: number | null = null;
  account: any;

  constructor(
    private transferService: TransferService,
    private accountService: AccountService,
    private alert: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.account = this.accountService.accountValue; // or subscribe if it's an observable
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    this.transferService.list(params).pipe(first()).subscribe({
      next: (rows: any) => { this.transfers = rows; this.loading = false; },
      error: err => { this.alert.error(err); this.loading = false; }
    });
  }

  goCreate() {
    this.router.navigate(['/transfers/create']);
  }

  view(t: any) {
    // Accept either the transfer object or an id passed directly.
    const id = (typeof t === 'object') 
      ? (t?.transferId) 
      : t;
  
    if (!id) {
      console.warn('transfer view called without valid id or transfer object:', t);
      // optionally show a user-friendly message
      return this.alert?.error?.('Unable to open transfer: invalid id'); // keep UI consistent if you have alert service
    }
  
    // navigate safely (segment must not be undefined)
    this.router.navigate(['/transfers', String(id)]);
  }

  accept(transfer: Transfer) {
    if (!confirm('Accept this transfer?')) return;
    this.transferService.accept(transfer.transferId).pipe(first()).subscribe({
      next: () => { this.alert.success('Transfer accepted'); this.load(); },
      error: e => this.alert.error(e)
    });
  }

  //canAccept(t: Transfer): boolean { return t.status === 'in_transfer'; }
  // canAccept(t: Transfer): boolean {
  //   if (!t || t.status !== 'in_transfer') return false;
  //   const acct = this.account || {};
  //   // admins can accept any transfer; room-in-charge (for toRoom) can accept
  //   const adminRoles = ['superAdmin', 'admin', 'stockroomAdmin'];
  //   if (adminRoles.includes(acct.role)) return true;
  //   // t.toRoom may be included by backend; fallback: allow only if acct.accountId equals toRoom.roomInCharge
  //   const roomInCharge = t.toRoom?.roomInCharge ?? t.toRoomId;
  //   return String(acct.accountId) === String(roomInCharge);
  // }
  canAccept(t: Transfer): boolean {
    if (!t) return false;
    const status = String(t.status || '').toLowerCase();
    if (!['pending', 'in_transfer'].includes(status)) return false;
  
    const acct = this.account || {};
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
}