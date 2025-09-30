// import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormsModule } from '@angular/forms';
// import { StockRequestRoutingModule } from './stock-request-routing.module';

// import { StockRequestListComponent } from './stock-request-list.component';
// import { StockRequestViewComponent } from './stock-request-view.component';

// @NgModule({
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     FormsModule,
//     StockRequestRoutingModule
//   ],
//   declarations: [
//     StockRequestListComponent,
//     StockRequestViewComponent
//   ]
// })
// export class StockRequestModule { }

// src/app/stock-request/stock-request.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StockRequestRoutingModule } from './stock-request-routing.module';

import { StockRequestListComponent } from './stock-request-list.component';
import { StockRequestViewComponent } from './stock-request-view.component';
import { StockRequestCreateComponent } from './stock-request-create.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StockRequestRoutingModule
  ],
  declarations: [
    StockRequestListComponent,
    StockRequestViewComponent,
    StockRequestCreateComponent
  ]
})
export class StockRequestModule { }
