import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AccountService } from './_services';
import { Account, Role } from './_models';

@Component({ selector: 'app-root', templateUrl: 'app.component.html' })
export class AppComponent {
    Role = Role;
    account?: Account | null;
    isSidebarVisible = false;
    showAdminPanelSubmenu = false;

    constructor(private accountService: AccountService, private router: Router) {
        this.accountService.account.subscribe(x => this.account = x);

        // Close sidebar on navigation and check for active routes
        this.router.events.subscribe(() => {
            this.isSidebarVisible = false;

            // Auto-expand admin menu if we are on an admin route
            if (this.router.url.startsWith('/admin')) {
                this.showAdminPanelSubmenu = true;
            }
        });
    }

    toggleSidebar() {
        this.isSidebarVisible = !this.isSidebarVisible;
    }

    toggleAdminPanelSubmenu() {
        this.showAdminPanelSubmenu = !this.showAdminPanelSubmenu;
    }

    logout() {
        this.isSidebarVisible = false;
        this.accountService.logout();
    }
}