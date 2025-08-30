import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { RoomAddEditComponent } from './room.add-edit.component';
import { RoomListComponent } from './room-list.component';
import { RoomViewComponent } from './room-view.component';

// const routes: Routes = [
//     {
//         path: '', component: LayoutComponent,
//         children: [
//             { path: 'add', component: RoomAddEditComponent },
//             { path: 'edit/:id', component: RoomAddEditComponent }
//         ]
//     }
// ];
const routes: Routes = [
    { path: '', component: LayoutComponent,
      children: [
        { path: '', component: RoomListComponent },        // list ( /room )
        { path: 'add', component: RoomAddEditComponent },  // add
        { path: 'edit/:id', component: RoomAddEditComponent }, // edit
        { path: ':id', component: RoomViewComponent }      // view detail ( /room/:id )
      ]
    }
  ];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RoomRoutingModule { }