import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { BorrowListComponent } from './borrow-list.component';
import { BorrowCreateComponent } from './borrow-create.component';
import { BorrowViewComponent } from './borrow-view.component';

const routes: Routes = [
  {
    path: '', component: LayoutComponent,
    children: [
      { path: '', component: BorrowListComponent },
      { path: 'create', component: BorrowCreateComponent },
      { path: ':id', component: BorrowViewComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BorrowRoutingModule { }