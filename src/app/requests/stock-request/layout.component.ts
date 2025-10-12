import { Component } from '@angular/core';
import { Router    } from '@angular/router';

import { 
    AlertService, 
    AccountService, 
    StockRequestService 
  } from '@app/_services';

@Component({ templateUrl: 'layout.component.html' })
export class LayoutComponent { 
    constructor(
        private router: Router,
        private sr: StockRequestService,
        private alert: AlertService,
        private accountService: AccountService
    ){
        //this.account = this.accountService.accountValue;
    }

    create() { this.router.navigate(['/req-stock', 'create']); }
}