import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApparelUnitListComponent } from './apparel-unit-list.component';
import { AdminSupplyUnitListComponent } from './admin-supply-unit-list.component';
import { GenItemUnitListComponent } from './gen-item-unit-list.component';

const routes: Routes = [
    { path: 'apparel', component: ApparelUnitListComponent },
    { path: 'supply', component: AdminSupplyUnitListComponent },
    { path: 'general', component: GenItemUnitListComponent },
  ];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UnitRoutingModule { }
