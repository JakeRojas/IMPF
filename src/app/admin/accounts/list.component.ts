import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';

@Component({ 
    selector: 'app-accounts-list',
    templateUrl: 'list.component.html' 
})
export class ListComponent implements OnInit {
    accounts?: any[];
    loading = false;

    constructor(
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.loadAccounts();
    }

    loadAccounts() {
        this.loading = true;
        this.accountService.getAll()
        .pipe(first())
        .subscribe({
          next: (accounts: any[]) => {
            this.accounts = (accounts || []).map(a => ({
              ...a,
              AccountId: a.accountId ?? a.AccountId ?? a.id,
              status: a.status ?? a._status ?? (a.isActive ? 'active' : 'deactivated'),
              toggling: false
            }));
            this.loading = false;
          },
          error: (err: any) => {
            this.alertService.error(err);
            this.loading = false;
          }
        });
      }
}