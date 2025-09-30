import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { ApparelReleaseComponent } from './apparel-release.component';
import { AdminSupplyReleaseComponent } from './admin-supply-release.component';

const routes: Routes = [
  { path: '', component: LayoutComponent,
    children: [
      { path: 'apparel', component: ApparelReleaseComponent }, // /room/:id/release
      { path: 'supply', component: AdminSupplyReleaseComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReleaseRoutingModule {}
