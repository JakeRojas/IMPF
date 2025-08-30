//main
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private accountService: AccountService, private alertService: AlertService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            // if ([401, 403].includes(err.status) && this.accountService.accountValue) {
            //     // auto logout if 401 or 403 response returned from api
            //     this.accountService.logout();
            // }

            if (err.status === 401 && this.accountService.accountValue) {
                console.warn('Unauthorize  (401).', err);
                this.accountService.logout();
            }
            
            // (optional) handle 403 gracefully: notify user but do NOT logout
            if (err.status === 403) {
                console.warn('Permission denied (403).', err);
                // optionally show an alert instead of logging out:
                this.alertService?.error('You do not have permission to perform this action.');
            }

            const error = (err && err.error && err.error.message) || err.statusText;
            console.error(err);
            return throwError(() => error);
        }))
    }

    // intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    //     return next.handle(request).pipe(
    //       catchError((err) => {
    //         // Print full error to console for debugging
    //         console.error('HTTP ERROR (debug):', {
    //           url: request.url,
    //           status: err.status,
    //           body: err.error,
    //           message: err.message
    //         });
      
    //         // keep previous behavior so UI still receives error
    //         const errorMsg = err?.error?.message ?? err.message ?? 'Unknown error';
    //         return throwError(() => new Error(errorMsg));
    //       })
    //     );
    //   }
}