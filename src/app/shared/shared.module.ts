import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxPanZoomModule } from 'ngx-panzoom';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgxPanZoomModule
  ],
  exports: [
    ReactiveFormsModule,
    FontAwesomeModule,
    NgxPanZoomModule
  ]
})
export class SharedModule { }
