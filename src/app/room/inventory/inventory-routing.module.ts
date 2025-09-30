// import { NgModule } from '@angular/core';
// import { Routes, RouterModule } from '@angular/router';
// import { LayoutComponent } from './layout.component';
// import { ApparelInventoryListComponent } from './apparel-inventory-list.component';
// import { AdminSupplyInventoryListComponent } from './admin-supply-inventory-list.component';
// // import { GenItemInventoryListComponent } from './gen-item-inventory-list.component';

// const routes: Routes = [
//   { path: '', component: LayoutComponent,
//     children: [
//       //{ path: '', redirectTo: 'apparel', pathMatch: 'full' },
//       //{ path: '', redirectTo: 'path', pathMatch: 'full' },
//       { path: '', component: ApparelInventoryListComponent },
//       { path: '', component: AdminSupplyInventoryListComponent },
//       // { path: 'general', component: GenItemInventoryListComponent },
//     ]
//   }
// ];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule]
// })
// export class InventoryRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { ApparelInventoryListComponent } from './apparel-inventory-list.component';
import { AdminSupplyInventoryListComponent } from './admin-supply-inventory-list.component';
import { GenItemInventoryListComponent } from './gen-item-inventory-list.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'apparel', component: ApparelInventoryListComponent },
      { path: 'supply',  component: AdminSupplyInventoryListComponent },
      { path: 'general', component: GenItemInventoryListComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule {}