import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RecursoDecisionComponent } from './components/recurso-decision/recurso-decision.component';
import { RecursoConversacionComponent } from './components/recurso-conversacion/recurso-conversacion.component';
import { RecursoEntradaComponent } from './components/recurso-entrada/recurso-entrada.component';
import { RecursoAlertaComponent } from './components/recurso-alerta/recurso-alerta.component';

@NgModule({
  declarations: [
    LoginPageComponent,
    SignupPageComponent,
    RecursoDecisionComponent,
    RecursoConversacionComponent,
    RecursoEntradaComponent,
    RecursoAlertaComponent,
  ],
  imports: [CommonModule, AuthRoutingModule, SharedModule],
})
export class AuthModule {}
