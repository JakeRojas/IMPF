import { NgModule } from '@angular/core';
import {
  RouterModule,
  Routes
} from '@angular/router';

import { LayoutComponent } from './layout.component';

import { ApparelReleaseComponent } from './apparel/release.component';
import { AdminSupplyReleaseComponent } from './admin-supply/release.component';
import { GenItemReleaseComponent } from './gen-item/release.component';

import { ApparelReleasedListComponent } from './apparel/release-list.component';
import { AdminSupplyReleasedListComponent } from './admin-supply/release-list.component';
import { GenItemReleasedListComponent } from './gen-item/release-list.component';
import { ItReleaseComponent } from './it/release.component';
import { ItReleasedListComponent } from './it/release-list.component';

const routes: Routes = [
  {
    path: '', component: LayoutComponent,
    children: [
      { path: 'apparel', component: ApparelReleaseComponent }, // /room/:id/release
      { path: 'apparel/list', component: ApparelReleasedListComponent },
      { path: 'supply', component: AdminSupplyReleaseComponent },
      { path: 'supply/list', component: AdminSupplyReleasedListComponent },
      { path: 'general', component: GenItemReleaseComponent },
      { path: 'general/list', component: GenItemReleasedListComponent },
      { path: 'it', component: ItReleaseComponent },
      { path: 'it/list', component: ItReleasedListComponent },
      { path: 'maintenance', component: GenItemReleaseComponent },
      { path: 'maintenance/list', component: GenItemReleasedListComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReleaseRoutingModule { }
