import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { RoomRoutingModule } from './room-routing.module';
import { RoomListComponent } from './room-list.component';
import { RoomAddEditComponent } from './room.add-edit.component';
import { RoomViewComponent } from './room-view.component';
import { LayoutComponent } from './layout.component';

@NgModule({
    imports: [
        CommonModule,
        RoomRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule
    ],
    declarations: [
        RoomAddEditComponent,
        LayoutComponent,
        RoomListComponent,
        RoomViewComponent
    ]
})
export class RoomModule { }