import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UnitRoutingModule } from './unit-routing.module';
import { LayoutComponent } from './layout.component';

// unit list components
import { ApparelUnitListComponent } from './apparel.list.component';
import { AdminSupplyUnitListComponent } from './admin-supply.list.component';
import { GenItemUnitListComponent } from './gen-item.list.component';

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
        ApparelUnitListComponent,
        AdminSupplyUnitListComponent,
        GenItemUnitListComponent
    ]
})
export class UnitModule { }
