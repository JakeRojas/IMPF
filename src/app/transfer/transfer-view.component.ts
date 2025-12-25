import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransferService, AccountService, AlertService } from '@app/_services';    // adapt to your alert service

@Component({
  selector: 'app-transfer-view',
  templateUrl: './transfer-view.component.html'
})
export class TransferViewComponent implements OnInit {
  transfer: any = null;
  loading = false;
  account: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transferService: TransferService,
    private accountService: AccountService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.account = this.accountService.accountValue || null;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.alert.error('Invalid transfer id');
      this.router.navigate(['/transfers']);
      return;
    }
    this.loadTransfer(id);
  }

  loadTransfer(id: string | number) {
    this.loading = true;
    this.transferService.getById(id).subscribe({
      next: (res: any) => {
        // If your API returns { data: ... } adjust accordingly
        this.transfer = res?.data ?? res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.alert.error(err?.message || 'Unable to load transfer');
        this.router.navigate(['/transfers']);
      }
    });
  }

  // reuse same logic as list for permission: only room-in-charge or admin roles can accept
  // canAccept(): boolean {
  //   if (!this.transfer || this.transfer.status !== 'in_transfer') return false;
  //   const acct = this.account || {};
  //   const role = String(acct.role || '').toLowerCase();
  //   const adminRoles = ['superadmin', 'admin', 'stockroomadmin', 'super_admin', 'admin']; // align with your role strings
  //   if (adminRoles.includes(role)) return true;
  //   const roomInCharge = this.transfer?.toRoom?.roomInCharge ?? this.transfer?.toRoomId;
  //   return String(acct.accountId) === String(roomInCharge);
  // }
  canAccept(): boolean {
    if (!this.transfer) return false;
  
    const status = String(this.transfer.status || '').toLowerCase();
    if (!['pending', 'in_transfer'].includes(status)) return false;
  
    const acct = this.account || {};
    const rawRole = acct.role ?? acct.roles ?? acct.roleName ?? '';
    const adminRoles = ['superadmin', 'admin', 'stockroomadmin', 'super_admin'];
  
    // normalize role: if array, map to lowercase strings
    let isAdmin = false;
    if (Array.isArray(rawRole)) {
      isAdmin = rawRole.map((r: any) => String(r).toLowerCase()).some((r: string) => adminRoles.includes(r));
    } else {
      isAdmin = adminRoles.includes(String(rawRole).toLowerCase());
    }
    if (isAdmin) return true;
  
    // allow room-in-charge to accept
    const roomInCharge = this.transfer?.toRoom?.roomInCharge ?? this.transfer?.toRoomId;
    return String(acct.accountId) === String(roomInCharge);
  }

  accept() {
    if (!this.transfer) return;
    if (!this.canAccept()) {
      this.alert.error('You are not authorized to accept this transfer');
      return;
    }

    if (!confirm('Accept this transfer and create receive record?')) return;
    this.loading = true;
    this.transferService.accept(this.transfer.transferId ?? this.transfer.id).subscribe({
      next: (res: any) => {
        this.alert.success('Transfer accepted');
        // reload transfer details
        const id = this.transfer.transferId ?? this.transfer.id;
        this.loadTransfer(id);
      },
      error: (err) => {
        this.loading = false;
        this.alert.error(err?.message || 'Failed to accept transfer');
      }
    });
  }

  back() {
    this.router.navigate(['/transfers']);
  }
}
