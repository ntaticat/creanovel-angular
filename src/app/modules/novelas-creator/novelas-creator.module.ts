import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NovelasCreatorRoutingModule } from './novelas-creator-routing.module';
import { NovelaCreatorPageComponent } from './novela-creator-page/novela-creator-page.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NovelaCreatorFormComponent } from './components/novela-creator-form/novela-creator-form.component';
import { EscenaCreatorFormComponent } from './components/escena-creator-form/escena-creator-form.component';
import { RecursoCreatorFormComponent } from './components/recurso-creator-form/recurso-creator-form.component';
import { PersonajeCreatorFormComponent } from './components/personaje-creator-form/personaje-creator-form.component';
import { FondoCreatorFormComponent } from './components/fondo-creator-form/fondo-creator-form.component';
import { NovelasCreatorPageComponent } from './novelas-creator-page/novelas-creator-page.component';
import { NovelaCreatePageComponent } from './novela-create-page/novela-create-page.component';
import { NovelasCreatorModuleLayoutComponent } from 'src/app/layouts/novelas-creator-module-layout/novelas-creator-module-layout.component';
import { MapaRecursosComponent } from './components/mapa-recursos/mapa-recursos.component';
import { NovelasCreatorDetailPageComponent } from './novelas-creator-detail-page/novelas-creator-detail-page.component';
import { ModalActionsComponent } from './components/modal-actions/modal-actions.component';
import { NovelaCreatorLayoutComponent } from './components/novela-creator-layout/novela-creator-layout.component';

@NgModule({
  declarations: [
    NovelaCreatorPageComponent,
    NovelaCreatorFormComponent,
    EscenaCreatorFormComponent,
    RecursoCreatorFormComponent,
    PersonajeCreatorFormComponent,
    FondoCreatorFormComponent,
    NovelasCreatorPageComponent,
    NovelaCreatePageComponent,
    NovelasCreatorModuleLayoutComponent,
    MapaRecursosComponent,
    NovelasCreatorDetailPageComponent,
    ModalActionsComponent,
    NovelaCreatorLayoutComponent,
  ],
  imports: [CommonModule, NovelasCreatorRoutingModule, SharedModule],
})
export class NovelasCreatorModule {}
