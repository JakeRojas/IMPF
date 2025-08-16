import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { RoomRoutingModule } from './room-routing.module';
import { RoomAddEditComponent } from './room.add-edit.component';
import { LayoutComponent } from './layout.component';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RoomRoutingModule
    ],
    declarations: [
        RoomAddEditComponent,
        LayoutComponent
    ]
})
export class RoomModule { }