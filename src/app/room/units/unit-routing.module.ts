import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { ApparelUnitListComponent } from './apparel.list.component';
import { AdminSupplyUnitListComponent } from './admin-supply.list.component';
import { GenItemUnitListComponent } from './gen-item.list.component';

const routes: Routes = [
    { path: '', component: LayoutComponent,
      children: [
        { path: 'apparel', component: ApparelUnitListComponent },
        { path: 'supply', component: AdminSupplyUnitListComponent },
        { path: 'general', component: GenItemUnitListComponent },
      ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UnitRoutingModule { }
