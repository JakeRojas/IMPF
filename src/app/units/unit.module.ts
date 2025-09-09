import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UnitRoutingModule } from './unit-routing.module';
import { UnitListComponent } from './unit-list.component';
import { LayoutComponent } from './layout.component';

@NgModule({
    imports: [
        CommonModule,
        UnitRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule
    ],
    declarations: [
        LayoutComponent,
        UnitListComponent
    ]
})
export class RoomModule { }