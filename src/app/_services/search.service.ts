import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService, RoomService } from './';
import { map, catchError } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';

export interface SearchResult {
    title: string;
    description?: string;
    route: string;
    type: 'nav' | 'action' | 'data';
    icon?: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
    constructor(
        private router: Router,
        private accountService: AccountService,
        private roomService: RoomService
    ) { }

    private getStaticRoutes(): SearchResult[] {
        const role = (this.accountService.accountValue?.role || '').toLowerCase();
        const routes: SearchResult[] = [
            { title: 'Dashboard', route: '/', type: 'nav', icon: 'bi-grid-1x2' },
            { title: 'My Profile', route: '/profile', type: 'nav', icon: 'bi-person-badge' },
            { title: 'Rooms', route: '/room', type: 'nav', icon: 'bi-door-open' },
            { title: 'Inventory Scan', route: '/scan', type: 'nav', icon: 'bi-qr-code-scan' },
            { title: 'Borrowing', route: '/borrow', type: 'nav', icon: 'bi-hand-index' },
        ];

        if (['superadmin', 'stockroomadmin'].includes(role)) {
            routes.push({ title: 'Transfers', route: '/transfers', type: 'nav', icon: 'bi-arrow-left-right' });
        }

        if (['superadmin', 'admin', 'stockroomadmin'].includes(role)) {
            routes.push({ title: 'Stock Requests', route: '/req-stock', type: 'nav', icon: 'bi-box-seam' });
        }

        if (['superadmin', 'admin', 'stockroomadmin', 'teacher', 'user'].includes(role)) {
            routes.push({ title: 'Item Requests', route: '/req-item', type: 'nav', icon: 'bi-clipboard-check' });
        }

        if (role === 'superadmin') {
            routes.push({ title: 'Manage Accounts', route: '/admin/accounts', type: 'nav', icon: 'bi-people' });
            routes.push({ title: 'Manage Logs', route: '/admin/manage-logs', type: 'nav', icon: 'bi-journal-text' });
        }

        return routes;
    }

    private getActions(): SearchResult[] {
        const role = (this.accountService.accountValue?.role || '').toLowerCase();
        const actions: SearchResult[] = [
            { title: 'Update Profile', route: '/profile', type: 'action', icon: 'bi-gear' },
            { title: 'New Item Request', route: '/req-item/create', type: 'action', icon: 'bi-plus-circle' },
            { title: 'New Borrow Request', route: '/borrow/create', type: 'action', icon: 'bi-plus-circle' },
        ];

        if (['superadmin'].includes(role)) {
            actions.push({ title: 'Create Room', route: '/room/create', type: 'action', icon: 'bi-plus-circle' });
            actions.push({ title: 'New Stock Request', route: '/req-stock/create', type: 'action', icon: 'bi-plus-circle' });
        }

        if (role === 'superadmin') {
            actions.push({ title: 'Add New User', route: '/admin/accounts/add', type: 'action', icon: 'bi-person-plus' });
        }

        return actions;
    }

    search(query: string): Observable<SearchResult[]> {
        if (!query || query.length < 2) return of([]);

        const q = query.toLowerCase();
        const staticResults = [...this.getStaticRoutes(), ...this.getActions()].filter(item =>
            item.title.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q))
        );

        const currentAccount = this.accountService.accountValue;
        const role = (currentAccount?.role || '').toLowerCase();

        // Dynamic results (Rooms) - use getRooms() which is filtered by role/access in backend
        const roomObs = this.roomService.getRooms().pipe(
            map(rooms => rooms.filter(r =>
                (r.roomName || '').toLowerCase().includes(q) ||
                (r.roomFloor || '').toLowerCase().includes(q))
                .map(r => ({
                    title: `Room: ${r.roomName}`,
                    description: `Floor: ${r.roomFloor || 'N/A'}`,
                    route: `/room/view/${r.roomId}`,
                    type: 'data' as const,
                    icon: 'bi-door-open-fill'
                }))),
            catchError(() => of([])) // Avoid breaking search if one call fails
        );

        // Dynamic results (Accounts) - Only for SuperAdmin
        let accountObs: Observable<SearchResult[]> = of([]);
        if (role === 'superadmin') {
            accountObs = this.accountService.getAll().pipe(
                map(accounts => accounts.filter(a =>
                    a.firstName?.toLowerCase().includes(q) ||
                    a.lastName?.toLowerCase().includes(q) ||
                    a.email?.toLowerCase().includes(q))
                    .map(a => ({
                        title: `User: ${a.firstName} ${a.lastName}`,
                        description: a.email,
                        route: `/admin/accounts/edit/${a.AccountId}`,
                        type: 'data' as const,
                        icon: 'bi-person-fill'
                    }))),
                catchError(() => of([]))
            );
        }

        return forkJoin({
            staticRes: of(staticResults),
            rooms: roomObs,
            accounts: accountObs
        }).pipe(
            map(({ staticRes, rooms, accounts }) => {
                const combined = [...staticRes, ...rooms, ...accounts];
                // Limit to 10 results for better UX
                return combined.slice(0, 10);
            })
        );
    }
}
