import { NgModule             } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent            } from './layout.component';
import { ItemRequestListComponent   } from './item-request-list.component';
import { ItemRequestCreateComponent } from './item-request-create.component';
import { ItemRequestViewComponent   } from './item-request-view.component';

const routes: Routes = [
  { path: '', component: LayoutComponent,
    children: [
      { path: '', component: ItemRequestListComponent },
      { path: 'create', component: ItemRequestCreateComponent },
      { path: 'view/:id', component: ItemRequestViewComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ItemRequestRoutingModule {}
