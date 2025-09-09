import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UnitListComponent } from './unit-list.component';
import { LayoutComponent } from './layout.component';

const routes: Routes = [
    { path: '', component: LayoutComponent,
      children: [
        { path: '', component: UnitListComponent },        // list ( /room )
      ]
    }
  ];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UnitRoutingModule { }