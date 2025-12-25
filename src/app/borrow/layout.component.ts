import { Component } from '@angular/core';
import { Router } from '@angular/router';

import {
    AlertService,
    AccountService,
    BorrowService
} from '@app/_services';

@Component({ templateUrl: 'layout.component.html' })
export class LayoutComponent {
    constructor(
        private router: Router,
        private br: BorrowService,
        private alert: AlertService,
        private accountService: AccountService
    ){
    }

    goCreate() {
        this.router.navigate(['/borrow/create']);
    }
}