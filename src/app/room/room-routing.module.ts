import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { RoomListComponent } from './room-list.component';
import { RoomViewComponent } from './room-view.component';

const unitModule = () => import('./units/unit.module').then(x => x.UnitModule);
const addEditModule = () => import('./add-edit/list.module').then(x => x.AddEditModule);

// new feature modules (lazy)
const inventoryModule = () => import('./inventory/inventory.module').then(x => x.InventoryModule);
const receiveModule   = () => import('./receive/receive.module').then(x => x.ReceiveModule);
const releaseModule   = () => import('./release/release.module').then(x => x.ReleaseModule);

const routes: Routes = [
  { path: '', component: LayoutComponent,
    children: [
      { path: '', component: RoomListComponent},
      { path: '', loadChildren: addEditModule },
      {
        path: ':id', component: RoomViewComponent,
        children: [
          { path: 'units',   loadChildren: unitModule },
          { path: 'inventory', loadChildren: inventoryModule },
          { path: 'receive',   loadChildren: receiveModule },
          { path: 'release',   loadChildren: releaseModule },
        ]
      },
    ]
  },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RoomRoutingModule { }