import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StockRequestRoutingModule } from './stock-request-routing.module';

import { LayoutComponent } from './layout.component';
import { StockRequestListComponent } from './stock-request.list.component';
import { StockRequestViewComponent } from './stock-request.view.component';
import { StockRequestCreateComponent } from './stock-request.create.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    StockRequestRoutingModule
  ],
  declarations: [
    LayoutComponent,
    StockRequestListComponent,
    StockRequestViewComponent,
    StockRequestCreateComponent
  ]
})
export class StockRequestModule { }
