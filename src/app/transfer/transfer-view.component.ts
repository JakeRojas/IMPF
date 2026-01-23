import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransferService, AccountService, AlertService } from '@app/_services';
import { first } from 'rxjs/operators';

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
  ) { }

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
    this.transferService.getById(id).pipe(first()).subscribe({
      next: (res: any) => {
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

  canAccept(): boolean {
    if (!this.transfer) return false;

    const acct = this.account || {};
    // Creator cannot accept
    if (String(this.transfer.createdBy) === String(acct.accountId)) return false;

    const status = String(this.transfer.status || '').toLowerCase();
    if (!['pending', 'in_transfer'].includes(status)) return false;

    const rawRole = acct.role ?? acct.roles ?? acct.roleName ?? '';
    const adminRoles = ['superadmin', 'admin', 'stockroomadmin', 'super_admin'];

    let isAdmin = false;
    if (Array.isArray(rawRole)) {
      isAdmin = rawRole.map((r: any) => String(r).toLowerCase()).some((r: string) => adminRoles.includes(r));
    } else {
      isAdmin = adminRoles.includes(String(rawRole).toLowerCase());
    }
    if (isAdmin) return true;

    const roomInCharge = this.transfer?.toRoom?.roomInCharge ?? this.transfer?.toRoomId;
    return String(acct.accountId) === String(roomInCharge);
  }

  canReceive(): boolean {
    if (!this.transfer) return false;
    if (String(this.transfer.status || '').toLowerCase() !== 'transfer_accepted') return false;

    const acct = this.account || {};
    // Only the one who accepted the transfer can receive it
    return String(acct.accountId) === String(this.transfer.acceptedBy);
  }

  accept() {
    if (!this.transfer) return;
    if (!this.canAccept()) {
      this.alert.error('You are not authorized to accept this transfer');
      return;
    }

    if (!confirm('Accept this transfer?')) return;
    this.loading = true;
    this.transferService.accept(this.transfer.transferId ?? this.transfer.id).pipe(first()).subscribe({
      next: (res: any) => {
        this.alert.success('Transfer accepted');
        this.loadTransfer(this.transfer.transferId ?? this.transfer.id);
      },
      error: (err) => {
        this.loading = false;
        this.alert.error(err?.message || 'Failed to accept transfer');
      }
    });
  }

  receive() {
    if (!this.transfer) return;
    if (!this.canReceive()) {
      this.alert.error('You are not authorized to receive this transfer');
      return;
    }

    if (!confirm('Mark this transfer as received and update inventory?')) return;
    this.loading = true;
    this.transferService.receive(this.transfer.transferId ?? this.transfer.id).pipe(first()).subscribe({
      next: (res: any) => {
        this.alert.success('Transfer received successfully');
        this.loadTransfer(this.transfer.transferId ?? this.transfer.id);
      },
      error: (err) => {
        this.loading = false;
        this.alert.error(err?.message || 'Failed to receive transfer');
      }
    });
  }

  back() {
    this.router.navigate(['/transfers']);
  }
}
