import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TransferRoutingModule } from './transfer-routing.module';

import { TransferListComponent } from './transfer-list.component';
import { TransferCreateComponent } from './transfer-create.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TransferRoutingModule
  ],
  declarations: [
    TransferListComponent,
    TransferCreateComponent
  ]
})
export class TransferModule {}