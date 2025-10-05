// import { catchError, of } from 'rxjs';

// import { AccountService } from '@app/_services';

// export function appInitializer(accountService: AccountService) {
//     return () => accountService.refreshToken()
//         .pipe(
//             // catch error to start app on success or failure
//             catchError(() => of())
//         );
// }

import { APP_INITIALIZER } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AccountService } from '@app/_services';

export function appInitializer(accountService: AccountService) {
  return () => {
    try {
      // Only try refresh if there is an account in localStorage OR a refresh token cookie present
      const hasAccount = !!localStorage.getItem('account');
      const hasRefreshCookie = typeof document !== 'undefined' && document.cookie && document.cookie.includes('refreshToken=');

      if (!hasAccount && !hasRefreshCookie) {
        // no reason to call refresh-token on a fresh client
        return Promise.resolve();
      }

      // attempt refresh; swallow errors so app still boots
      return accountService.refreshToken().pipe(
        catchError(() => of(null))
      ).toPromise();
    } catch (e) {
      return Promise.resolve();
    }
  };
}

// In providers:
export const appInitializerProvider = [
  { provide: APP_INITIALIZER, useFactory: appInitializer, deps: [AccountService], multi: true }
];