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
    //accUpdating: number | null = null;

    constructor(
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        // this.accountService.getAll()
        //     .pipe(first())
        //     .subscribe(accounts => this.accounts = accounts);
        this.loadAccounts();
    }

    loadAccounts() {
        this.loading = true;
    
        // this.accountService.getAll()
        //   .pipe(first())
        //   .subscribe({
        //     next: (accounts: any[]) => {
        //       this.accounts = (accounts || []).map(a => ({
        //         ...a,
        //         // prefer `status`; fallback to `_status` or boolean `isActive`
        //         status: a.status ?? a._status ?? (a.isActive ? 'active' : 'deactivated'),
        //         toggling: false
        //       }));
        //       this.loading = false;
        //     },
        //     error: (err: any) => {
        //       this.alertService.error(err);
        //       this.loading = false;
        //     }
        //   });
        this.accountService.getAll()
        .pipe(first())
        .subscribe({
          next: (accounts: any[]) => {
            this.accounts = (accounts || []).map(a => ({
              ...a,
              // normalize id field so templates can rely on AccountId
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

    // deleteAccount(AccountId: number) {
    //     const account = this.accounts!.find(x => x.AccountId === AccountId);
    //     account.isDeleting = true;
    //     this.accountService.delete(AccountId)
    //         .pipe(first())
    //         .subscribe(() => {
    //             this.accounts = this.accounts!.filter(x => x.AccountId !== AccountId)
    //         });
    // }
}