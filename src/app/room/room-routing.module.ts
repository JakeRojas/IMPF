import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { RoomListComponent } from './room-list.component';
import { RoomViewComponent } from './room-view.component';

const unitModule = () => import('./units/unit.module').then(x => x.UnitModule);
const addEditModule = () => import('./add-edit/list.module').then(x => x.AddEditModule);

const routes: Routes = [
  { path: '', component: LayoutComponent,
    children: [
      { path: '', component: RoomListComponent},
      { path: '', loadChildren: addEditModule },
      {
        path: ':id', component: RoomViewComponent,
          children: [
            { path: 'units', loadChildren: unitModule },
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
