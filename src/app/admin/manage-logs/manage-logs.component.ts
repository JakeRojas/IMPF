import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';

@Component({
    templateUrl: 'manage-logs.component.html'
})
export class ManageLogsComponent implements OnInit {
    logs: any[] = [];
    loading = false;

    // Pagination
    page = 1;
    limit = 10;
    total = 0;
    totalPages = 0;

    // Filters
    startDate: string = '';
    endDate: string = '';
    actionType: string = '';
    userId: string = '';

    constructor(
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.loadLogs();
    }

    loadLogs() {
        this.loading = true;

        const filters: any = {};
        if (this.startDate) filters.startDate = this.startDate;
        if (this.endDate) filters.endDate = this.endDate;
        if (this.actionType) filters.actionType = this.actionType;
        if (this.userId) filters.userId = this.userId;

        this.accountService.getAllActivityLogs(filters, this.page, this.limit)
            .pipe(first())
            .subscribe({
                next: (response) => {
                    this.logs = response.data || [];
                    if (response.meta) {
                        this.total = response.meta.total;
                        this.totalPages = response.meta.totalPages;
                        this.page = response.meta.page;
                    }
                    this.loading = false;
                },
                error: (error) => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    onPageChange(page: number) {
        this.page = page;
        this.loadLogs();
    }

    range(start: number, end: number): number[] {
        return [...Array(end - start + 1).keys()].map(i => i + start);
    }

    clearFilters() {
        this.startDate = '';
        this.endDate = '';
        this.actionType = '';
        this.userId = '';
        this.page = 1;
        this.loadLogs();
    }
}
