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

    constructor(
        private accountService: AccountService,
        private stockService: StockRequestService,
        private itemService: ItemRequestService,
        private transferService: TransferService,
        private borrowService: BorrowService,
        private statsService: StatsService
    ) { }

    ngOnInit() {
        this.loadStats();
        this.loadRecentLogs();
        this.loadDashboardStats();
    }

    loadStats() {
        // Fetch counts by requesting 1 item and reading meta.total
        this.stockService.list({}, 1, 1).pipe(first()).subscribe({
            next: (res: any) => this.stockCount = res.meta?.total || 0,
            error: () => this.stockCount = 0
        });

        this.itemService.list({}, 1, 1).pipe(first()).subscribe({
            next: (res: any) => this.itemCount = res.meta?.total || 0,
            error: () => this.itemCount = 0
        });

        this.transferService.list({}, 1, 1).pipe(first()).subscribe({
            next: (res: any) => this.transferCount = res.meta?.total || 0,
            error: () => this.transferCount = 0
        });

        this.borrowService.list({}, 1, 1).pipe(first()).subscribe({
            next: (res: any) => this.borrowCount = res.meta?.total || 0,
            error: () => this.borrowCount = 0
        });
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

    loadDashboardStats() {
        if (!this.isAdmin) return;

        this.statsService.getDashboardStats().pipe(first()).subscribe({
            next: (res: any) => {
                this.weeklyStats = res.weekly;
                this.onlineUsers = res.daily.onlineUsers;
                // Update specific today counts if they differ (optional, but keep consistent)
                this.stockCount = res.daily.stockRequests;
                this.itemCount = res.daily.itemRequests;
                this.transferCount = res.daily.transfers;
                this.borrowCount = res.daily.borrows;

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

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.weeklyStats.labels.map((l: string) => {
                    const d = new Date(l);
                    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                }),
                datasets: [
                    {
                        label: 'Stock Requests',
                        data: this.weeklyStats.stockRequests,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Item Requests',
                        data: this.weeklyStats.itemRequests,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Transfers',
                        data: this.weeklyStats.transfers,
                        backgroundColor: 'rgba(153, 102, 255, 0.7)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Borrows',
                        data: this.weeklyStats.borrows,
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    // Role helpers
    get isAdmin() {
        const role = String(this.account?.role || '').toLowerCase();
        return ['superadmin', 'admin', 'stockroomadmin'].includes(role);
    }
}