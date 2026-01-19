import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AccountService } from './_services';
import { Account, Role } from './_models';

@Component({ selector: 'app-root', templateUrl: 'app.component.html' })
export class AppComponent {
    Role = Role;
    account?: Account | null;
    isSidebarVisible = false;

    constructor(private accountService: AccountService, private router: Router) {
        this.accountService.account.subscribe(x => this.account = x);

        // Close sidebar on navigation
        this.router.events.subscribe(() => {
            this.isSidebarVisible = false;
        });
    }

    toggleSidebar() {
        this.isSidebarVisible = !this.isSidebarVisible;
    }

    logout() {
        this.isSidebarVisible = false;
        this.accountService.logout();
    }
}