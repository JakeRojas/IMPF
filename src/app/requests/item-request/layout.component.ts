import { Component } from '@angular/core';
import { Router    } from '@angular/router';

import { 
    AlertService, 
    AccountService, 
    ItemRequestService 
  } from '@app/_services';

@Component({ templateUrl: 'layout.component.html' })
export class LayoutComponent { 
    account: any;
    constructor(
        private router: Router,
        private sr: ItemRequestService,
        private alert: AlertService,
        private accountService: AccountService
    ){
        this.account = this.accountService.accountValue;
    }

    create() { this.router.navigate(['/req-item', 'create']); }

    isStockroomAdmin() { return this.account?.role === 'stockroomAdmin' || this.account?.role === 'admin' || this.account?.role === 'superAdmin'; }
    isTeacher() { return this.account?.role === 'teacher' || this.account?.role === 'roomInCharge' || this.account?.role === 'user'; }
    isSuperAdmin() { return this.account?.role === 'superAdmin'; }
}