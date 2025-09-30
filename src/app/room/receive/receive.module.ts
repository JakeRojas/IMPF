import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ReceiveRoutingModule } from './receive-routing.module';
import { ApparelReceiveComponent } from './apparel-receive.component';
import { AdminSupplyReceiveComponent } from './admin-supply-receive.component';
import { GenItemReceiveComponent } from './gen-item-receive.component';
import { LayoutComponent } from './layout.component';

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
    GenItemReceiveComponent
  ]
})
export class ReceiveModule {}
