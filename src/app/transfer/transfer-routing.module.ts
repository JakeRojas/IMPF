import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent          } from './layout.component';
import { TransferListComponent    } from './transfer-list.component';
import { TransferCreateComponent  } from './transfer-create.component';
import { TransferViewComponent    } from './transfer-view.component';

const routes: Routes = [
  { path: '', component: LayoutComponent,
    children: [
      { path: '', component: TransferListComponent },       // /transfers
      { path: 'create', component: TransferCreateComponent }, // /transfers/create
      { path: ':id', component: TransferViewComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransferRoutingModule {}