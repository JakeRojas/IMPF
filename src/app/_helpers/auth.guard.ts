//main
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AccountService } from '@app/_services';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private accountService: AccountService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const account = this.accountService.accountValue;
        if (account) {
            // check if route is restricted by role
            if (route.data.roles && !route.data.roles.includes(account.role)) {
                // role not authorized so redirect to home page
                this.router.navigate(['/']);
                return false;
            }
            // if (route.data.roles) {
            //     const allowed = route.data.roles.map((r: string) => (r || '').toString().toLowerCase());
            //     const current = (account.role || '').toString().toLowerCase();
            //     if (!allowed.includes(current)) {
            //         this.router.navigate(['/']);
            //         return false;
            //     }
            // }

            // authorized so return true
            return true;
        }

        // not logged in so redirect to login page with the return url 
        this.router.navigate(['/account/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
    // canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    //     const account = this.accountService.accountValue;
    //     if (account) {
    //         // check if route is restricted by role
    //         if (route.data.roles) {
    //             const allowed = (route.data.roles as string[]).map(r => String(r).toLowerCase());
    //             const userRole = String(account.role ?? '').toLowerCase();
    //             if (!allowed.includes(userRole)) {
    //                 // role not authorized so redirect to home page
    //                 this.router.navigate(['/']);
    //                 return false;
    //             }
    //         }
    
    //         // authorized so return true
    //         return true;
    //     }
    
    //     // not logged in so redirect to login page with the return url 
    //     this.router.navigate(['/account/login'], { queryParams: { returnUrl: state.url } });
    //     return false;
    // }
}