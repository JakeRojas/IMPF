import { NgModule     } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ReactiveFormsModule, 
  FormsModule 
} from '@angular/forms';

import { ReleaseRoutingModule } from './release-routing.module';
import { LayoutComponent      } from './layout.component';

import { ApparelReleaseComponent      } from './apparel/release.component';
import { AdminSupplyReleaseComponent  } from './admin-supply/release.component';
import { GenItemReleaseComponent      } from './gen-item/release.component';

import { ApparelReleasedListComponent     } from './apparel/release-list.component';
import { AdminSupplyReleasedListComponent } from './admin-supply/release-list.component';
import { GenItemReleasedListComponent } from './gen-item/release-list.component';

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
    AdminSupplyReleaseComponent,
    GenItemReleaseComponent,

    ApparelReleasedListComponent,
    AdminSupplyReleasedListComponent,
    GenItemReleasedListComponent
  ]
})
export class ReleaseModule {}
