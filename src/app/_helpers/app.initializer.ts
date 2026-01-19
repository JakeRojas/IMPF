import { APP_INITIALIZER } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AccountService } from '@app/_services';

export function appInitializer(accountService: AccountService) {
  return () => {
    try {
      const hasAccount = !!localStorage.getItem('account');
      const hasRefreshCookie = typeof document !== 'undefined' && document.cookie && (document.cookie.includes('refreshToken=') || document.cookie.includes('fakeRefreshToken='));

      if (!hasAccount && !hasRefreshCookie) {
        return Promise.resolve();
      }

      return accountService.refreshToken().pipe(
        catchError(() => of(null))
      ).toPromise();
    } catch (e) {
      return Promise.resolve();
    }
  };
}

export const appInitializerProvider = [
  { provide: APP_INITIALIZER, useFactory: appInitializer, deps: [AccountService], multi: true }
];