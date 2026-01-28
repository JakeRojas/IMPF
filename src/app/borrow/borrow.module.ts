import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LayoutComponent } from './layout.component';
import { BorrowRoutingModule } from './borrow-routing.module';
import { BorrowListComponent } from './borrow-list.component';
import { BorrowCreateComponent } from './borrow-create.component';
import { BorrowViewComponent } from './borrow-view.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BorrowRoutingModule
  ],
  declarations: [
    LayoutComponent,
    BorrowListComponent,
    BorrowCreateComponent,
    BorrowViewComponent
  ]
})
export class BorrowModule { }