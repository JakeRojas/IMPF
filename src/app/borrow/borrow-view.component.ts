import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BorrowService, AccountService, AlertService } from '@app/_services';
import { first } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-borrow-view',
    templateUrl: './borrow-view.component.html'
})
export class BorrowViewComponent implements OnInit {
    borrow: any = null;
    siblings: any[] = [];
    loading = false;
    account: any = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private borrowService: BorrowService,
        private accountService: AccountService,
        private alert: AlertService
    ) { }

    ngOnInit(): void {
        this.account = this.accountService.accountValue || null;
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.alert.error('Invalid borrow id');
            this.router.navigate(['/borrow']);
            return;
        }
        this.loadBorrow(id);
    }

    loadBorrow(id: string | number) {
        this.loading = true;
        this.borrowService.getById(Number(id)).pipe(first()).subscribe({
            next: (res: any) => {
                const data = res?.data ?? res;
                if (!data) {
                    this.loadBorrowFallback(id);
                    return;
                }
                this.borrow = data;
                this.loadSiblings(this.borrow);
            },
            error: (err) => {
                // If getById fails (e.g. 404 or not implemented), try finding it via list search
                this.loadBorrowFallback(id);
            }
        });
    }

    loadBorrowFallback(id: string | number) {
        // Fallback: search for the ID in the list
        // We assume 'search' param works for IDs as it does in the list view
        this.borrowService.list({ search: String(id) }, 1, 5).pipe(first()).subscribe({
            next: (res: any) => {
                const candidates = res.data || [];
                // Find exact match
                const found = candidates.find((b: any) => String(b.borrowId) === String(id) || String(b.id) === String(id));

                if (found) {
                    this.borrow = found;
                    this.loadSiblings(this.borrow);
                } else {
                    this.loading = false;
                    // Only error if we really can't find it
                    this.alert.error('Borrow request not found');
                }
            },
            error: (e) => {
                this.loading = false;
                this.alert.error('Unable to load borrow request');
            }
        });
    }

    loadSiblings(anchor: any) {
        if (!anchor || !anchor.createdAt) {
            this.siblings = [anchor];
            this.loading = false;
            return;
        }

        const d = new Date(anchor.createdAt);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD

        // Fetch potential siblings from the same day
        this.borrowService.list({ startDate: dateStr, endDate: dateStr }, 1, 1000).pipe(first()).subscribe({
            next: (res: any) => {
                const all = res.data ?? [];
                // Filter strictly by same requester, room, status, and close time (within 1 min)
                const anchorTime = new Date(anchor.createdAt).getTime();
                this.siblings = all.filter((b: any) => {
                    if (b.status !== anchor.status) return false;
                    // Handle different shapes of room/requester objects just in case
                    const rId = b.room?.roomId ?? b.roomId;
                    const uId = b.requester?.accountId ?? b.requesterId;
                    const aRId = anchor.room?.roomId ?? anchor.roomId;
                    const aUId = anchor.requester?.accountId ?? anchor.requesterId;

                    if (String(rId) !== String(aRId)) return false;
                    if (String(uId) !== String(aUId)) return false;

                    const bTime = new Date(b.createdAt).getTime();
                    return Math.abs(bTime - anchorTime) < 60000; // 1 minute window
                });

                // Ensure anchor is in the list if not found (should be found if logic corrects)
                if (!this.siblings.find(s => String(s.borrowId) === String(anchor.borrowId))) {
                    this.siblings.push(anchor);
                }

                this.loading = false;
            },
            error: () => {
                // Fallback to just showing the single item
                this.siblings = [anchor];
                this.loading = false;
            }
        });
    }

    private myAccountId(): string {
        return String(this.account?.accountId);
    }

    isSuperAdmin(): boolean {
        const role = this.account?.role ?? this.account?.roles ?? this.account?.roleName;
        if (!role) return false;
        if (Array.isArray(role)) {
            return role.some((r: any) => String(r).toLowerCase() === 'superadmin');
        }
        return String(role).toLowerCase() === 'superadmin';
    }

    isRequester(b: any): boolean {
        if (!b) return false;
        const requesterId = b?.requester?.accountId ?? b?.requesterId;
        return this.myAccountId() === String(requesterId);
    }

    private resolveRoomInChargeId(b: any): string | null {
        if (!b) return null;
        const c = b?.room?.roomInCharge;
        if (c !== undefined && c !== null && String(c) !== '') return String(c);
        return null;
    }

    isRoomInCharge(b: any): boolean {
        const myId = this.myAccountId();
        if (!myId) return false;
        const roomInChargeId = this.resolveRoomInChargeId(b);
        if (!roomInChargeId) return false;
        return myId === String(roomInChargeId);
    }

    // Check actions against the anchor borrow (assuming all siblings share status)
    showApproveDecline(): boolean {
        return String(this.borrow?.status ?? '').toLowerCase() === 'waiting_for_approval' && (this.isRoomInCharge(this.borrow) || this.isSuperAdmin());
    }

    showAcquireCancel(): boolean {
        return String(this.borrow?.status ?? '').toLowerCase() === 'approved' && this.isRequester(this.borrow);
    }

    showReturnButton(): boolean {
        return String(this.borrow?.status ?? '').toLowerCase() === 'acquired' && this.isRequester(this.borrow);
    }

    showAcceptReturn(): boolean {
        return String(this.borrow?.status ?? '').toLowerCase() === 'in_return' && (this.isRoomInCharge(this.borrow) || this.isSuperAdmin());
    }

    private getIds(): number[] {
        return this.siblings.map(s => Number(s.borrowId ?? s.id)).filter(id => !isNaN(id));
    }

    approve() {
        if (!confirm(`Approve ${this.siblings.length > 1 ? 'all ' + this.siblings.length + ' items' : 'this borrow request'}?`)) return;
        const ids = this.getIds();
        this.loading = true;
        forkJoin(ids.map(id => this.borrowService.approve(id))).pipe(first()).subscribe({
            next: () => { this.alert.success('Approved'); this.loadBorrow(this.borrow.borrowId); },
            error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
        });
    }

    decline() {
        const reason = prompt('Reason for declining (optional):') || undefined;
        if (!confirm(`Decline ${this.siblings.length > 1 ? 'all ' + this.siblings.length + ' items' : 'this borrow request'}?`)) return;
        const ids = this.getIds();
        if (!ids.length) return;
        this.loading = true;
        forkJoin(ids.map(id => this.borrowService.decline(id, reason))).pipe(first()).subscribe({
            next: () => { this.alert.success('Declined'); this.loadBorrow(this.borrow.borrowId); },
            error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
        });
    }

    acquire() {
        if (!confirm('Mark as acquired?')) return;
        const ids = this.getIds();
        this.loading = true;
        forkJoin(ids.map(id => this.borrowService.acquire(id))).pipe(first()).subscribe({
            next: () => { this.alert.success('Marked as acquired'); this.loadBorrow(this.borrow.borrowId); },
            error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
        });
    }

    cancel() {
        if (!confirm('Cancel request?')) return;
        const ids = this.getIds();
        this.loading = true;
        forkJoin(ids.map(id => this.borrowService.cancel(id))).pipe(first()).subscribe({
            next: () => { this.alert.success('Cancelled'); this.loadBorrow(this.borrow.borrowId); },
            error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
        });
    }

    markReturn() {
        if (!confirm('Mark as returned?')) return;
        const ids = this.getIds();
        this.loading = true;
        forkJoin(ids.map(id => this.borrowService.markReturn(id))).pipe(first()).subscribe({
            next: () => { this.alert.success('Return initiated'); this.loadBorrow(this.borrow.borrowId); },
            error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
        });
    }

    acceptReturned() {
        if (!confirm('Accept returned items?')) return;
        const ids = this.getIds();
        this.loading = true;
        forkJoin(ids.map(id => this.borrowService.acceptReturn(id))).pipe(first()).subscribe({
            next: () => { this.alert.success('Return accepted'); this.loadBorrow(this.borrow.borrowId); },
            error: e => { this.alert.error(e?.message ?? e); this.loading = false; }
        });
    }

    back() {
        this.router.navigate(['/borrow']);
    }
}
