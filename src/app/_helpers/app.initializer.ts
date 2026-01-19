import { APP_INITIALIZER } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AccountService } from '@app/_services';

export function appInitializer(accountService: AccountService) {
  return () => {
    try {
      // In production, refresh token cookies are often HttpOnly and invisible to document.cookie.
      // We attempt a refresh on startup to restore the session if a valid cookie exists.
      // This ensures that refreshing the page doesn't log the user out even if localStorage is transient.
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