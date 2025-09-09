import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AddEditRoutingModule } from './add-edit-routing.module';
import { RoomAddEditComponent } from './room.add-edit.component';

@NgModule({
    imports: [
        CommonModule,
        AddEditRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule
    ],
    declarations: [
        RoomAddEditComponent,
    ]
})
export class AddEditModule { }
