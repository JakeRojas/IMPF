import { Injectable } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import {
  Observable,
  throwError
} from 'rxjs';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';

import { AccountService, AlertService } from '@app/_services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private accountService: AccountService, private alertService: AlertService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      const url = (err && err.url) || request?.url || '';

      if (typeof url === 'string' && url.includes('/accounts/refresh-token')) {
        return throwError(() => new Error('refresh-failed'));
      }

      if (err.status === 401 && this.accountService.accountValue?.jwtToken) {
        console.warn('Unauthorized - attempting silent refresh');

        // Attempt to refresh the token
        return this.accountService.refreshToken().pipe(
          switchMap((account) => {
            // Refresh succeeded, retry the original request with the new token
            console.log('Refresh succeeded, retrying request:', request.url);
            const retriedRequest = request.clone({
              setHeaders: { Authorization: `Bearer ${account.jwtToken}` }
            });
            return next.handle(retriedRequest);
          }),
          catchError((refreshErr) => {
            // Refresh failed, log out and throw the original error
            console.error('Refresh failed - logging out', refreshErr);
            this.accountService.logout();
            return throwError(() => err);
          })
        );
      }

      if (err.status === 403) {
        this.alertService?.error('You do not have permission to perform this action.');
      }

      const error = (err && err.error && err.error.message) || err.statusText || 'Server error';
      console.error(err);
      return throwError(() => (error));
    }));
  }
}