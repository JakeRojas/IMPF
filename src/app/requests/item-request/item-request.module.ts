import { NgModule             } from '@angular/core';
import { CommonModule         } from '@angular/common';
import { ReactiveFormsModule  } from '@angular/forms';

import { LayoutComponent            } from './layout.component';
import { ItemRequestRoutingModule   } from './item-request-routing.module';
import { ItemRequestListComponent   } from './item-request-list.component';
import { ItemRequestViewComponent   } from './item-request-view.component';
import { ItemRequestCreateComponent } from './item-request-create.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ItemRequestRoutingModule
  ],
  declarations: [
    LayoutComponent,
    ItemRequestListComponent,
    ItemRequestViewComponent,
    ItemRequestCreateComponent
  ]
})
export class ItemRequestModule {}
