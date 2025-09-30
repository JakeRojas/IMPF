import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { RoomRoutingModule } from './room-routing.module';
import { LayoutComponent } from './layout.component';
import { RoomListComponent } from './room-list.component';
import { RoomViewComponent } from './room-view.component';

@NgModule({
    imports: [
        CommonModule,
        RoomRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule
    ],
    declarations: [ 
        LayoutComponent,
        RoomListComponent,
        RoomViewComponent
    ]
})
export class RoomModule { }
