import { Injectable }                       from '@angular/core';
import { Router }                           from '@angular/router';
import { HttpClient }                       from '@angular/common/http';
import { BehaviorSubject, Observable, of }  from 'rxjs';
import { map, finalize, catchError  }       from 'rxjs/operators';

import { environment }  from '@environments/environment';
import { Account }      from '@app/_models';

const baseUrl = `${environment.apiUrl}/accounts`;

@Injectable({ providedIn: 'root' })
export class AccountService {
    private accountSubject: BehaviorSubject<Account | null>;
    public account: Observable<Account | null>;

    constructor(
        private router: Router,
        private http: HttpClient,
    ) {
        // this.accountSubject = new BehaviorSubject<Account | null>(null);
        // this.account = this.accountSubject.asObservable();
        const stored = localStorage.getItem('account');
        const initialAccount = stored ? JSON.parse(stored) : null;
        this.accountSubject = new BehaviorSubject<Account | null>(initialAccount);
        this.account = this.accountSubject.asObservable();

        // if there is an account saved, start the refresh timer
        if (initialAccount) {
            // ensure timer starts (in case account was loaded from localStorage)
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
    refreshToken() {
        return this.http.post<any>(`${baseUrl}/refresh-token`, {}, { withCredentials: true })
            .pipe(map((account) => {
                // persist
                localStorage.setItem('account', JSON.stringify(account));
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }
    revokeToken() {
        const refreshToken = /* this.currentRefreshToken() || */ localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // nothing to revoke
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
    // currentRefreshToken(): string | null {
    //     const acct = JSON.parse(localStorage.getItem('account') || 'null');
    //     return acct?.refreshToken ?? null;
    // }
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
                // update the current account if it was updated
                if (account.AccountId === this.accountValue?.AccountId) {
                    // publish updated account to subscribers
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
                // auto logout if the logged in account was deleted
                if (AccountId === this.accountValue?.AccountId)
                    this.logout();
            }));
    }

    // helper methods
    private refreshTokenTimeout?: any;
    private startRefreshTokenTimer() {
        // parse json object from base64 encoded jwt token
        const jwtBase64 = this.accountValue!.jwtToken!.split('.')[1];
        const jwtToken = JSON.parse(atob(jwtBase64));

        // set a timeout to refresh the token a minute before it expires
        const expires = new Date(jwtToken.exp * 1000);
        const timeout = expires.getTime() - Date.now() - (60 * 1000);
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
    }
    private stopRefreshTokenTimer() {
        clearTimeout(this.refreshTokenTimeout);
    }
}

// // src/app/_services/account.service.ts
// import { Injectable }                       from '@angular/core';
// import { Router }                           from '@angular/router';
// import { HttpClient }                       from '@angular/common/http';
// import { BehaviorSubject, Observable, of }  from 'rxjs';
// import { map, finalize, catchError  }       from 'rxjs/operators';

// import { environment }  from '@environments/environment';
// import { Account }      from '@app/_models';

// const baseUrl = `${environment.apiUrl}/accounts`;

// @Injectable({ providedIn: 'root' })
// export class AccountService {
//     private accountSubject: BehaviorSubject<Account | null>;
//     public account: Observable<Account | null>;

//     constructor(
//         private router: Router,
//         private http: HttpClient,
//     ) {
//         const stored = localStorage.getItem('account');
//         const initialAccount = stored ? JSON.parse(stored) : null;
//         this.accountSubject = new BehaviorSubject<Account | null>(initialAccount);
//         this.account = this.accountSubject.asObservable();

//         // if there is an account saved, start the refresh timer
//         if (initialAccount) {
//             this.startRefreshTokenTimer();
//         }
//     }

//     public get accountValue() {
//         return this.accountSubject.value;
//     }

//     // ------------- auth / tokens -------------
//     login(email: string, password: string) {
//         return this.http.post<any>(`${baseUrl}/authenticate`, { email, password }, { withCredentials: true })
//             .pipe(map(account => {
//                 // persist to localStorage
//                 localStorage.setItem('account', JSON.stringify(account));
//                 this.accountSubject.next(account);
//                 this.startRefreshTokenTimer();
//                 return account;
//             }));
//     }

//     logout() {
//         // attempt to revoke server refresh token, ignore error
//         this.http.post<any>(`${baseUrl}/revoke-token`, {}, { withCredentials: true }).subscribe({
//             error: err => { /* ignore */ }
//         });

//         this.stopRefreshTokenTimer();
//         this.accountSubject.next(null);
//         localStorage.removeItem('account');
//         this.router.navigate(['/account/login']);
//     }

//     refreshToken() {
//         return this.http.post<any>(`${baseUrl}/refresh-token`, {}, { withCredentials: true })
//             .pipe(map((account) => {
//                 // persist
//                 localStorage.setItem('account', JSON.stringify(account));
//                 this.accountSubject.next(account);
//                 this.startRefreshTokenTimer();
//                 return account;
//             }));
//     }

//     revokeToken() {
//         const refreshToken = localStorage.getItem('refreshToken');
//         if (!refreshToken) {
//             // nothing to revoke
//             return of(null);
//         }

//         return this.http.post(`${baseUrl}/revoke-token`, { token: refreshToken })
//             .pipe(
//                 catchError(err => {
//                     // swallow revoke errors so callers don't break
//                     console.warn('revokeToken failed (ignored)', err);
//                     return of(null);
//                 })
//             );
//     }

//     // ------------- account API methods -------------
//     register(account: Account) {
//         return this.http.post(`${baseUrl}/register`, account);
//     }

//     verifyEmail(token: string) {
//         return this.http.post(`${baseUrl}/verify-email`, { token });
//     }

//     forgotPassword(email: string) {
//         return this.http.post(`${baseUrl}/forgot-password`, { email });
//     }

//     validateResetToken(token: string) {
//         return this.http.post(`${baseUrl}/validate-reset-token`, { token });
//     }

//     resetPassword(token: string, password: string, confirmPassword: string) {
//         return this.http.post(`${baseUrl}/reset-password`, { token, password, confirmPassword });
//     }

//     getAll() {
//         return this.http.get<Account[]>(baseUrl, { withCredentials: true });
//     }

//     getById(AccountId: number) {
//         return this.http.get<Account>(`${baseUrl}/${AccountId}`, { withCredentials: true });
//     }

//     create(params: any) {
//         // backend route is /accounts/create-user according to your frontend usage
//         return this.http.post(`${baseUrl}/create-user`, params, { withCredentials: true });
//     }

//     /**
//      * Update account.
//      * Handles two possible backend response shapes:
//      *  - Direct account object (account)
//      *  - Wrapper: { success: true, message: '...', account: {...} }
//      *
//      * If the updated account is the currently logged-in account, update the stored account.
//      */
//     update(AccountId: number, params: any) {
//         return this.http.put<any>(`${baseUrl}/${AccountId}`, params, { withCredentials: true })
//             .pipe(map((res: any) => {
//                 // backend sometimes returns { success, message, account } or simply the account object
//                 const updatedAccount = res && res.account ? res.account : res;

//                 // If the currently logged-in account was updated, update local storage & subject
//                 const current = this.accountValue;
//                 if (current && (current.AccountId === updatedAccount.AccountId || current.AccountId === AccountId)) {
//                     // Merge existing token fields (jwtToken etc.) if backend response doesn't include them
//                     const merged = { ...current, ...updatedAccount };

//                     // make sure jwtToken isn't lost if backend response didn't include it
//                     if (!merged.jwtToken && current.jwtToken) {
//                         merged.jwtToken = current.jwtToken;
//                     }

//                     localStorage.setItem('account', JSON.stringify(merged));
//                     this.accountSubject.next(merged);
//                 }

//                 return updatedAccount;
//             }));
//     }

//     delete(AccountId: number) {
//         return this.http.delete(`${baseUrl}/${AccountId}`, { withCredentials: true })
//             .pipe(finalize(() => {
//                 // auto logout if the logged in account was deleted
//                 if (AccountId === this.accountValue?.AccountId) {
//                     this.logout();
//                 }
//             }));
//     }

//     // ------------- helpers: refresh timer -------------
//     private refreshTokenTimeout?: any;
//     private startRefreshTokenTimer() {
//         // accountValue.jwtToken assumed to be a JWT; parse expiry
//         if (!this.accountValue?.jwtToken) return;

//         try {
//             const jwtBase64 = this.accountValue.jwtToken.split('.')[1];
//             const jwtToken = JSON.parse(atob(jwtBase64));

//             // set a timeout to refresh the token a minute before it expires
//             const expires = new Date(jwtToken.exp * 1000);
//             const timeout = expires.getTime() - Date.now() - (60 * 1000);
//             // in case timeout is negative (expired) refresh immediately
//             if (timeout <= 0) {
//                 this.refreshToken().subscribe();
//             } else {
//                 this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
//             }
//         } catch (err) {
//             console.warn('startRefreshTokenTimer: failed to parse jwtToken', err);
//         }
//     }

//     private stopRefreshTokenTimer() {
//         if (this.refreshTokenTimeout) {
//             clearTimeout(this.refreshTokenTimeout);
//         }
//     }
// }
