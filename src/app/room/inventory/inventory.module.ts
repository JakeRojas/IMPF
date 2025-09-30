// src/app/room/inventory/inventory.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { InventoryRoutingModule } from './inventory-routing.module';
import { LayoutComponent } from './layout.component';
import { ApparelInventoryListComponent } from './apparel-inventory-list.component';
import { AdminSupplyInventoryListComponent } from './admin-supply-inventory-list.component';
import { GenItemInventoryListComponent } from './gen-item-inventory-list.component';

@NgModule({
  imports: [
    CommonModule,
    InventoryRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ],
  declarations: [
    LayoutComponent,
    ApparelInventoryListComponent,
    AdminSupplyInventoryListComponent,
    GenItemInventoryListComponent
  ]
})
export class InventoryModule {}
