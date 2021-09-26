import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NovelasRoutingModule } from './novelas-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';

import { NovelaPageComponent } from './novela-page/novela-page.component';
import { NovelasPageComponent } from './novelas-page/novelas-page.component';
import { NovelaComponent } from './novela-page/novela/novela.component';
import { NovelasComponent } from './novelas-page/novelas/novelas.component';
import { NovelaMessageComponent } from './novela-page/novela/novela-message/novela-message.component';
import { NovelaDecisionsComponent } from './novela-page/novela/novela-decisions/novela-decisions.component';
import { NovelaConversationComponent } from './novela-page/novela/novela-conversation/novela-conversation.component';
import { NovelaActionsComponent } from './novela-page/novela/novela-actions/novela-actions.component';


@NgModule({
  declarations: [
    NovelaPageComponent,
    NovelasPageComponent,
    NovelaComponent,
    NovelasComponent,
    NovelaMessageComponent,
    NovelaDecisionsComponent,
    NovelaConversationComponent,
    NovelaActionsComponent
  ],
  imports: [
    CommonModule,
    NovelasRoutingModule,
    SharedModule
  ]
})
export class NovelasModule { }
