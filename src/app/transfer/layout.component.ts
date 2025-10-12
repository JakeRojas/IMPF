import { Component } from '@angular/core';
import { Router    } from '@angular/router';

import { 
    AlertService, 
    AccountService, 
    TransferService 
  } from '@app/_services';

@Component({ templateUrl: 'layout.component.html' })
export class LayoutComponent { 
    constructor(
        private router: Router,
        private sr: TransferService,
        private alert: AlertService,
        private accountService: AccountService
    ){
        //this.account = this.accountService.accountValue;
    }

    goCreate() {
        this.router.navigate(['/transfers/create']);
      }
}