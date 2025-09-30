import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TransferService } from '@app/_services';
import { AlertService } from '@app/_services';
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
  roomId: number | null = null; // optionally filter by current room
  account: any;

  constructor(
    private transferService: TransferService,
    private alert: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    // optional: if you have account service, get current account
    // this.account = this.accountService.accountValue;
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    // if you want to limit to this room (received or sent) add to params like toRoomId or fromRoomId
    this.transferService.list(params).pipe(first()).subscribe({
      next: (rows: any) => { this.transfers = rows; this.loading = false; },
      error: err => { this.alert.error(err); this.loading = false; }
    });
  }

  goCreate() {
    this.router.navigate(['/transfers/create']);
  }

  view(transfer: Transfer) {
    // navigate to view page if you make one, or show modal
    // example: this.router.navigate(['/transfers', transfer.transferId]);
    this.alert.info(JSON.stringify(transfer, null, 2));
  }

  accept(transfer: Transfer) {
    if (!confirm('Accept this transfer?')) return;
    this.transferService.accept(transfer.transferId).pipe(first()).subscribe({
      next: () => { this.alert.success('Transfer accepted'); this.load(); },
      error: e => this.alert.error(e)
    });
  }

  initiateReturn(transfer: Transfer) {
    if (!confirm('Start return to sender?')) return;
    this.transferService.return(transfer.transferId).pipe(first()).subscribe({
      next: () => { this.alert.success('Return initiated'); this.load(); },
      error: e => this.alert.error(e)
    });
  }

  acceptReturned(transfer: Transfer) {
    if (!confirm('Accept returned items?')) return;
    this.transferService.acceptReturn(transfer.transferId).pipe(first()).subscribe({
      next: () => { this.alert.success('Return accepted'); this.load(); },
      error: e => this.alert.error(e)
    });
  }

  // simple helper to show which actions are visible depending on status + role
  canAccept(t: Transfer): boolean { return t.status === 'in_transfer'; }
  canReturn(t: Transfer): boolean { return t.status === 'transfer_accepted'; }
  canAcceptReturned(t: Transfer): boolean { return t.status === 'returning'; }
}