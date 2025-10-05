import { NgModule             } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StockRequestListComponent    } from './stock-request.list.component';
import { StockRequestViewComponent    } from './stock-request.view.component';
import { StockRequestCreateComponent  } from './stock-request.create.component';
// ===============================================================================

const routes: Routes = [
    { path: '',         component: StockRequestListComponent },
    { path: 'create',   component: StockRequestCreateComponent },
    { path: 'view/:id', component: StockRequestViewComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StockRequestRoutingModule { }
