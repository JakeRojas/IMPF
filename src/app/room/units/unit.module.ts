import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UnitRoutingModule } from './unit-routing.module';

// unit list components
import { ApparelUnitListComponent } from './apparel-unit-list.component';
import { AdminSupplyUnitListComponent } from './admin-supply-unit-list.component';
import { GenItemUnitListComponent } from './gen-item-unit-list.component';

@NgModule({
    imports: [
        CommonModule,
        UnitRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule
    ],
    declarations: [
        ApparelUnitListComponent,
        AdminSupplyUnitListComponent,
        GenItemUnitListComponent
    ]
})
export class UnitModule { }
