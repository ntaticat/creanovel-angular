import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlayingNovelaRoutingModule } from './playing-novela-routing.module';
import { PlayingNovelaPageComponent } from './playing-novela-page/playing-novela-page.component';
import { PlayingNovelaComponent } from './playing-novela-page/playing-novela/playing-novela.component';
import { PlayingNovelaActionsComponent } from './playing-novela-page/playing-novela/novela-actions/playing-novela-actions.component';
import { PlayingNovelaConversationComponent } from './playing-novela-page/playing-novela/novela-conversation/playing-novela-conversation.component';
import { PlayingNovelaDecisionsComponent } from './playing-novela-page/playing-novela/novela-decisions/playing-novela-decisions.component';
import { PlayingNovelaMessageComponent } from './playing-novela-page/playing-novela/novela-message/playing-novela-message.component';

@NgModule({
  declarations: [
    PlayingNovelaPageComponent,
    PlayingNovelaComponent,
    PlayingNovelaActionsComponent,
    PlayingNovelaConversationComponent,
    PlayingNovelaDecisionsComponent,
    PlayingNovelaMessageComponent,
  ],
  imports: [CommonModule, PlayingNovelaRoutingModule],
})
export class PlayingNovelaModule {}
