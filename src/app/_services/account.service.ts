import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, finalize, catchError } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Account } from '@app/_models';

const baseUrl = `${environment.apiUrl}/accounts`;

@Injectable({ providedIn: 'root' })
export class AccountService {
    private accountSubject: BehaviorSubject<Account | null>;
    public account: Observable<Account | null>;

    constructor(
        private router: Router,
        private http: HttpClient,
    ) {
        const stored = localStorage.getItem('account');
        const initialAccount = stored ? JSON.parse(stored) : null;
        this.accountSubject = new BehaviorSubject<Account | null>(initialAccount);
        this.account = this.accountSubject.asObservable();

        if (initialAccount) {
            this.startRefreshTokenTimer();
        }
    }

    public get accountValue() {
        return this.accountSubject.value;
    }
    login(email: string, password: string) {
        return this.http.post<any>(`${baseUrl}/authenticate`, { email, password }, { withCredentials: true })
            .pipe(map(account => {
                // persist to localStorage
                localStorage.setItem('account', JSON.stringify(account));
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }
    logout() {
        this.http.post<any>(`${baseUrl}/revoke-token`, {}, { withCredentials: true }).subscribe();
        this.stopRefreshTokenTimer();
        this.accountSubject.next(null);
        localStorage.removeItem('account');
        this.router.navigate(['/account/login']);
    }
    private isRefreshing = false;
    refreshToken() {
        if (this.isRefreshing) return of(null);
        this.isRefreshing = true;

        return this.http.post<any>(`${baseUrl}/refresh-token`, {}, { withCredentials: true })
            .pipe(
                map((account) => {
                    localStorage.setItem('account', JSON.stringify(account));
                    this.accountSubject.next(account);
                    this.startRefreshTokenTimer();
                    return account;
                }),
                finalize(() => this.isRefreshing = false)
            );
    }
    revokeToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            return of(null);
        }

        return this.http.post(`${environment.apiUrl}/accounts/revoke-token`, { token: refreshToken })
            .pipe(
                // If revoke fails (401, 404, ...), swallow the error and return null so caller doesn't loop
                catchError(err => {
                    console.warn('revokeToken failed (ignored)', err);
                    return of(null);
                })
            );
    }
    register(account: Account) {
        return this.http.post(`${baseUrl}/register`, account);
    }
    verifyEmail(token: string) {
        return this.http.post(`${baseUrl}/verify-email`, { token });
    }
    forgotPassword(email: string) {
        return this.http.post(`${baseUrl}/forgot-password`, { email });
    }
    validateResetToken(token: string) {
        return this.http.post(`${baseUrl}/validate-reset-token`, { token });
    }
    resetPassword(token: string, password: string, confirmPassword: string) {
        return this.http.post(`${baseUrl}/reset-password`, { token, password, confirmPassword });
    }
    getAll() {
        return this.http.get<Account[]>(baseUrl, { withCredentials: true });
    }
    getById(AccountId: number) {
        return this.http.get<Account>(`${baseUrl}/${AccountId}`);
    }
    create(params: any) {
        return this.http.post(`${baseUrl}/create-user`, params, { withCredentials: true });
    }
    update(AccountId: number, params: any) {
        return this.http.put(`${baseUrl}/${AccountId}`, params)
            .pipe(map((account: any) => {
                if (account.AccountId === this.accountValue?.AccountId) {
                    account = { ...this.accountValue, ...account };
                    this.accountSubject.next(account);
                    localStorage.setItem('account', JSON.stringify(account));
                }
                return account;
            }));
    }
    delete(AccountId: number) {
        return this.http.delete(`${baseUrl}/${AccountId}`)
            .pipe(finalize(() => {
                if (AccountId === this.accountValue?.AccountId)
                    this.logout();
            }));
    }

    getAllActivityLogs(filters: any = {}, page: number = 1, limit: number = 10) {
        const params = { ...filters, page: page.toString(), limit: limit.toString() };
        return this.http.get<{ success: boolean, data: any[], meta: any }>(`${baseUrl}/activity-logs`, { params, withCredentials: true });
    }

    // helper methods
    private refreshTokenTimeout?: any;
    private startRefreshTokenTimer() {
        if (!this.accountValue || !this.accountValue.jwtToken) return;

        try {
            const jwtBase64 = this.accountValue.jwtToken.split('.')[1];
            if (!jwtBase64) return;

            const jwtToken = JSON.parse(atob(jwtBase64));

            const expires = new Date(jwtToken.exp * 1000);
            const timeout = expires.getTime() - Date.now() - (60 * 1000);

            // only set timeout if it's in the future, otherwise it could loop or trigger immediately
            this.stopRefreshTokenTimer();
            this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), Math.max(0, timeout));
        } catch (error) {
            console.error('Error starting refresh token timer', error);
        }
    }
    private stopRefreshTokenTimer() {
        clearTimeout(this.refreshTokenTimeout);
    }

    hasAnyAccount() {
        return this.http.get<{ exists: boolean }>(`${baseUrl}/exists`);
    }
    hasAnyAccountFlag() {
        return this.hasAnyAccount().pipe(
            map(resp => !!(resp && resp.exists))
        );
    }
}
