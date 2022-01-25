import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NovelasRoutingModule } from './novelas-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';

import { NovelaPageComponent } from './novela-page/novela-page.component';
import { NovelasPageComponent } from './novelas-page/novelas-page.component';
import { NovelasComponent } from './novelas-page/novelas/novelas.component';


@NgModule({
  declarations: [
    NovelaPageComponent,
    NovelasPageComponent,
    NovelasComponent,
  ],
  imports: [
    CommonModule,
    NovelasRoutingModule,
    SharedModule
  ]
})
export class NovelasModule { }
