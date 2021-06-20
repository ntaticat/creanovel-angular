import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NovelasRoutingModule } from './novelas-routing.module';
import { NovelasComponent } from './components/novelas/novelas.component';
import { NovelaComponent } from './components/novela/novela.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    NovelasComponent,
    NovelaComponent
  ],
  imports: [
    CommonModule,
    NovelasRoutingModule,
    SharedModule
  ]
})
export class NovelasModule { }
