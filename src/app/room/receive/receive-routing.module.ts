import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { ApparelReceiveComponent } from './apparel/receive.component';
import { AdminSupplyReceiveComponent } from './admin-supply/receive.component';
import { GenItemReceiveComponent } from './gen-item/receive.component';
import { ItReceiveComponent } from './it/receive.component';
import { ApparelReceivedListComponent } from './apparel/received-list.component';
import { AdminSupplyReceivedListComponent } from './admin-supply/received-list.component';
import { GenItemReceivedListComponent } from './gen-item/received-list.component';
import { ItReceivedListComponent } from './it/received-list.component';

const routes: Routes = [
  {
    path: '', component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'apparel', pathMatch: 'full' },
      { path: 'apparel', component: ApparelReceiveComponent },
      { path: 'apparel/list', component: ApparelReceivedListComponent },
      { path: 'supply', component: AdminSupplyReceiveComponent },
      { path: 'supply/list', component: AdminSupplyReceivedListComponent },
      { path: 'general', component: GenItemReceiveComponent },
      { path: 'general/list', component: GenItemReceivedListComponent },
      { path: 'it', component: ItReceiveComponent },
      { path: 'it/list', component: ItReceivedListComponent },
      { path: 'maintenance', component: GenItemReceiveComponent },
      { path: 'maintenance/list', component: GenItemReceivedListComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReceiveRoutingModule { }
