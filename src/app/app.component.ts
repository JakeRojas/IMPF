import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { AccountService, SearchService, SearchResult } from './_services';
import { Account, Role } from './_models';

@Component({ selector: 'app-root', templateUrl: 'app.component.html' })
export class AppComponent {
    Role = Role;
    account?: Account | null;
    isSidebarVisible = false;
    showAdminPanelSubmenu = false;

    // Search
    searchQuery = '';
    searchResults: SearchResult[] = [];
    isSearching = false;
    showSearchResults = false;

    @ViewChild('searchInput') searchInput!: ElementRef;

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
            event.preventDefault();
            this.searchInput.nativeElement.focus();
        }
        if (event.key === 'Escape') {
            this.showSearchResults = false;
        }
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        const resultsContainer = document.querySelector('.search-results-container');
        if (this.searchInput && !this.searchInput.nativeElement.contains(event.target) &&
            (!resultsContainer || !resultsContainer.contains(event.target as Node))) {
            this.showSearchResults = false;
        }
    }

    constructor(
        private accountService: AccountService,
        private router: Router,
        private searchService: SearchService
    ) {
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

    onSearch(event: any) {
        const query = event.target.value;
        this.searchQuery = query;

        if (!query || query.length < 2) {
            this.searchResults = [];
            this.showSearchResults = false;
            return;
        }

        this.isSearching = true;
        this.searchService.search(query).subscribe({
            next: (results) => {
                this.searchResults = results;
                this.isSearching = false;
                this.showSearchResults = true;
            },
            error: () => {
                this.isSearching = false;
            }
        });
    }

    navigateTo(route: string) {
        this.showSearchResults = false;
        this.searchQuery = '';
        this.router.navigate([route]);
    }

    getIconClass(type: string): string {
        switch (type) {
            case 'nav': return 'bi-arrow-right-circle text-primary';
            case 'action': return 'bi-plus-circle text-success';
            case 'data': return 'bi-database-fill text-warning';
            default: return 'bi-search';
        }
    }
}