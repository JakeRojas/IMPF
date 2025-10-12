import { Component, OnInit }  from '@angular/core';
import { Router }             from '@angular/router';
import { first }              from 'rxjs/operators';

import { 
  RoomService, 
  AccountService,
  QrService, 
  AlertService 
} from '@app/_services';

@Component({ templateUrl: 'layout.component.html' })
export class LayoutComponent { 
    isSuperAdmin = false;

    constructor(
        private accountService: AccountService,
    
        private router:       Router
      ) {}

    ngOnInit() {
        const user = this.accountService.accountValue;
        this.isSuperAdmin = user?.role === 'superAdmin';
      }
}