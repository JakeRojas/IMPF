import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
//import { SubNavComponent } from './subnav.component';
import { LayoutComponent } from './layout.component';
import { OverviewComponent } from './overview.component';
import { ManageLogsComponent } from './manage-logs/manage-logs.component';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        AdminRoutingModule
    ],
    declarations: [
        //SubNavComponent,
        LayoutComponent,
        OverviewComponent,
        ManageLogsComponent
    ]
})
export class AdminModule { }