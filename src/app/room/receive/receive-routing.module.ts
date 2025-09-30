// src/app/room/receive/receive-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { ApparelReceiveComponent } from './apparel-receive.component';
import { AdminSupplyReceiveComponent } from './admin-supply-receive.component';
import { GenItemReceiveComponent } from './gen-item-receive.component';

const routes: Routes = [
  { path: '', component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'apparel', pathMatch: 'full' },
      { path: 'apparel', component: ApparelReceiveComponent },
      { path: 'supply',  component: AdminSupplyReceiveComponent },
      { path: 'general', component: GenItemReceiveComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReceiveRoutingModule {}
