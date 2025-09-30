import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ReleaseRoutingModule } from './release-routing.module';
import { LayoutComponent } from './layout.component';
import { ApparelReleaseComponent } from './apparel-release.component';
import { AdminSupplyReleaseComponent } from './admin-supply-release.component';

@NgModule({
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    ReleaseRoutingModule
  ],
  declarations: [
    LayoutComponent,
    ApparelReleaseComponent,
    AdminSupplyReleaseComponent
  ]
})
export class ReleaseModule {}
