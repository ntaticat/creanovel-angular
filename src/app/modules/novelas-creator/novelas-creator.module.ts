import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NovelasCreatorRoutingModule } from './novelas-creator-routing.module';
import { NovelaCreatorPageComponent } from './novela-creator-page/novela-creator-page.component';
import { EscenaCreatorPageComponent } from './escena-creator-page/escena-creator-page.component';
import { RecursoCreatorPageComponent } from './recurso-creator-page/recurso-creator-page.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    NovelaCreatorPageComponent,
    EscenaCreatorPageComponent,
    RecursoCreatorPageComponent
  ],
  imports: [
    CommonModule,
    NovelasCreatorRoutingModule,
    SharedModule
  ]
})
export class NovelasCreatorModule { }
