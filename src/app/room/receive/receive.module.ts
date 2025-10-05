import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ReceiveRoutingModule } from './receive-routing.module';
import { LayoutComponent } from './layout.component';

import { ApparelReceiveComponent } from './apparel/receive.component';
import { AdminSupplyReceiveComponent } from './admin-supply/receive.component';
import { GenItemReceiveComponent } from './gen-item/receive.component';

import { ApparelReceivedListComponent } from './apparel/received-list.component';
import { AdminSupplyReceivedListComponent } from './admin-supply/received-list.component';
import { GenItemReceivedListComponent } from './gen-item/received-list.component';


@NgModule({
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    ReceiveRoutingModule
  ],
  declarations: [
    LayoutComponent,

    ApparelReceiveComponent,
    AdminSupplyReceiveComponent,
    GenItemReceiveComponent,

    ApparelReceivedListComponent,
    AdminSupplyReceivedListComponent,
    GenItemReceivedListComponent
  ]
})
export class ReceiveModule {}
