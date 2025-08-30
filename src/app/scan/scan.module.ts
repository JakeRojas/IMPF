import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScanRoutingModule } from './scan-routing.module';
import { ScanComponent } from './scan.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ScanComponent
],
  imports: [
    CommonModule,
    FormsModule,
    ScanRoutingModule
  ]
})
export class ScanModule {}