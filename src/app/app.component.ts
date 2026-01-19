import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AccountService } from './_services';
import { Account, Role } from './_models';

@Component({ selector: 'app-root', templateUrl: 'app.component.html' })
export class AppComponent {
    Role = Role;
    account?: Account | null;
    isSidebarVisible = false;

    constructor(private accountService: AccountService, private router: Router) {
        this.accountService.account.subscribe(x => this.account = x);

        // Close sidebar on navigation end
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.isSidebarVisible = false;
        });
    }

    toggleSidebar() {
        this.isSidebarVisible = !this.isSidebarVisible;
    }

    closeSidebar() {
        this.isSidebarVisible = false;
    }

    logout() {
        this.closeSidebar();
        this.accountService.logout();
    }
}