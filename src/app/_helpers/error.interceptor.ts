// //main
// import { Injectable } from '@angular/core';
// import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';

// import { AccountService, AlertService } from '@app/_services';

// @Injectable()
// export class ErrorInterceptor implements HttpInterceptor {
//     constructor(private accountService: AccountService, private alertService: AlertService) { }

//     intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//         return next.handle(request).pipe(catchError(err => {
//             // if ([401, 403].includes(err.status) && this.accountService.accountValue) {
//             //     // auto logout if 401 or 403 response returned from api
//             //     this.accountService.logout();
//             // }

//             const reqUrl = (err && err.url) || request?.url || '';
//             if (reqUrl.endsWith('/accounts/refresh-token')) {
//                 // Optionally log at debug level only:
//                 // console.debug('refresh-token call failed (suppressed):', err?.status, err?.error?.message || err?.statusText);
//                 // rethrow a small error so the upstream catchError in appInitializer can process it
//                 return throwError(() => '');
//             }

//             if (err.status === 401 && this.accountService.accountValue) {
//                 console.warn('Unauthorize  (401).', err);
//                 this.accountService.logout();
//             }
            
//             // (optional) handle 403 gracefully: notify user but do NOT logout
//             if (err.status === 403) {
//                 console.warn('Permission denied (403).', err);
//                 // optionally show an alert instead of logging out:
//                 this.alertService?.error('You do not have permission to perform this action.');
//             }

//             const error = (err && err.error && err.error.message) || err.statusText;
//             console.error(err);
//             return throwError(() => error);
//         }))
//     }

//     // intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     //     return next.handle(request).pipe(
//     //       catchError((err) => {
//     //         // Print full error to console for debugging
//     //         console.error('HTTP ERROR (debug):', {
//     //           url: request.url,
//     //           status: err.status,
//     //           body: err.error,
//     //           message: err.message
//     //         });
      
//     //         // keep previous behavior so UI still receives error
//     //         const errorMsg = err?.error?.message ?? err.message ?? 'Unknown error';
//     //         return throwError(() => new Error(errorMsg));
//     //       })
//     //     );
//     //   }
// }

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private accountService: AccountService, private alertService: AlertService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      // Defensive: if err or err.url missing, fallback to request.url
      const url = (err && err.url) || request?.url || '';

      // If this is any variant of refresh-token, suppress verbose console.error
      // (covers /accounts/refresh-token, /accounts/refresh-token/, ?v=1 etc.)
      if (typeof url === 'string' && url.includes('/accounts/refresh-token')) {
        // do not print the entire HttpErrorResponse to console for this specific call
        // the APP_INITIALIZER or caller should handle the failure gracefully
        return throwError(() => new Error('refresh-failed'));
      }

      // Standard handling for other cases:
      if (err.status === 401 && this.accountService.accountValue) {
        console.warn('Unauthorized - logging out', err);
        this.accountService.logout();
      }

      if (err.status === 403) {
        this.alertService?.error('You do not have permission to perform this action.');
      }

      // keep a readable error message for UI and debugging
      const error = (err && err.error && err.error.message) || err.statusText || 'Server error';
      // print only when not the refresh-token call
      console.error(err);
      return throwError(() => (error));
    }));
  }
}