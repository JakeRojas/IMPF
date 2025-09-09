import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RoomAddEditComponent } from './room.add-edit.component';

const routes: Routes = [
  { path: 'add', component: RoomAddEditComponent },
  { path: 'edit/:id', component: RoomAddEditComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AddEditRoutingModule { }
