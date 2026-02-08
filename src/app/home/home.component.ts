import { Component, OnInit } from '@angular/core';
import {
    AccountService,
    StockRequestService,
    ItemRequestService,
    TransferService,
    BorrowService,
    StatsService
} from '@app/_services';
import { first } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit {
    account = this.accountService.accountValue;

    // Stats
    stockCount = 0;
    itemCount = 0;
    transferCount = 0;
    borrowCount = 0;
    onlineUsers = 0;

    // Activity
    recentLogs: any[] = [];
    loadingLogs = false;

    // Weekly Chart Data
    weeklyStats: any;
    chart: any;

    // Visibility Getters
    get showStockCard() { return ['superadmin', 'admin', 'stockroomadmin'].includes(this.role); }
    get showItemCard() { return true; } // All roles
    get showTransferCard() { return ['superadmin', 'admin', 'stockroomadmin'].includes(this.role); }
    get showBorrowCard() { return true; } // All roles
    get showOnlineUsersCard() { return ['superadmin'].includes(this.role); }
    get showWeeklyStats() { return true; }
    get showRecentActivity() { return true; }

    get role() { return String(this.account?.role || '').toLowerCase(); }

    // Breakdown Data
    breakdowns: any = {};
    onlineUsersList: any[] = [];

    // Modal State
    showModal = false;
    modalTitle = '';
    modalData: any[] = [];
    modalType: 'stock' | 'item' | 'borrow' | 'online' = 'stock';

    constructor(
        private accountService: AccountService,
        private stockService: StockRequestService,
        private itemService: ItemRequestService,
        private transferService: TransferService,
        private borrowService: BorrowService,
        private statsService: StatsService
    ) { }

    ngOnInit() {
        this.loadRecentLogs();
        this.loadDashboardStats();
    }

    loadRecentLogs() {
        this.loadingLogs = true;
        this.accountService.getAllActivityLogs({}, 1, 5).pipe(first()).subscribe({
            next: (res) => {
                this.recentLogs = res.data || [];
                this.loadingLogs = false;
            },
            error: () => this.loadingLogs = false
        });
    }

    lastWeekStats: any = {};
    lastMonthStats: any = {};

    loadDashboardStats() {
        this.statsService.getDashboardStats().pipe(first()).subscribe({
            next: (res: any) => {
                this.weeklyStats = res.weekly || { labels: [], stockRequests: [], itemRequests: [], transfers: [], borrows: [] };
                this.lastWeekStats = res.lastWeek || {};
                this.lastMonthStats = res.lastMonth || {};

                // Update specific daily counts
                this.stockCount = res.daily?.stockRequests || 0;
                this.itemCount = res.daily?.itemRequests || 0;
                this.transferCount = res.daily?.transfers || 0;
                this.borrowCount = res.daily?.borrows || 0;
                this.onlineUsers = res.daily?.onlineUsers || 0;

                this.breakdowns = res.breakdowns || { stock: [], item: [], borrow: [] };
                this.onlineUsersList = res.online || [];

                setTimeout(() => this.createChart(), 100);
            },
            error: (err) => console.error('Error loading dashboard stats', err)
        });
    }

    createChart() {
        const ctx = document.getElementById('statsChart') as HTMLCanvasElement;
        if (!ctx) return;

        if (this.chart) {
            this.chart.destroy();
        }

        // Filter datasets based on role visibility
        const datasets = [];

        // Stock Requests
        if (this.showStockCard) {
            datasets.push({
                label: 'Stock Requests',
                data: this.weeklyStats.stockRequests || [],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            });
        }

        // Item Requests (Everyone)
        datasets.push({
            label: 'Item Requests',
            data: this.weeklyStats.itemRequests || [],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        });

        // Transfers
        if (this.showTransferCard) {
            datasets.push({
                label: 'Transfers',
                data: this.weeklyStats.transfers || [],
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            });
        }

        // Borrows (Everyone)
        datasets.push({
            label: 'Borrows',
            data: this.weeklyStats.borrows || [],
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        });

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: (this.weeklyStats.labels || []).map((l: string) => {
                    const d = new Date(l);
                    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                }),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    openBreakdown(type: 'stock' | 'item' | 'borrow' | 'online') {
        this.modalType = type;
        this.showModal = true;

        if (type === 'stock') {
            this.modalTitle = 'Stock Requests by Department';
            this.modalData = this.breakdowns.stock.map((b: any) => ({ name: b.itemType || 'Unknown', count: b.count }));
        } else if (type === 'item') {
            this.modalTitle = 'Item Requests by Department';
            this.modalData = this.breakdowns.item.map((b: any) => ({ name: b.itemType || 'Unknown', count: b.count }));
        } else if (type === 'borrow') {
            this.modalTitle = 'Borrows by User';
            this.modalData = this.breakdowns.borrow.map((b: any) => ({
                name: b.requester ? `${b.requester.firstName} ${b.requester.lastName}` : 'Unknown',
                count: b.count
            }));
        } else if (type === 'online') {
            this.modalTitle = 'Online Users';
            this.modalData = this.onlineUsersList;
        }
    }

    closeModal() {
        this.showModal = false;
    }
}