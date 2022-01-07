import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { environment } from 'src/environments/environment';

import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { appReducers } from './store/app.reducer';
import { NovelasEffects } from './store/novelas/novelas.effects';



import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NovelasModule } from './modules/novelas/novelas.module';
import { UsuariosEffects } from './store/usuarios/usuarios.effects';
import { LecturasEffects } from '@store/lecturas/lecturas.effects';
import { RecursosEffects } from '@store/recursos/recursos.effects';
import { EscenasEffects } from '@store/escenas/escenas.effects';
import { MainPageComponent } from './layouts/main-page/main-page.component';
import { NovelasCreatorEffects } from '@store/novela-creator/novelas-creator.effects';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    MainPageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    StoreModule.forRoot(appReducers),
    EffectsModule.forRoot([NovelasEffects, UsuariosEffects, LecturasEffects, RecursosEffects, EscenasEffects, NovelasCreatorEffects]),
    environment.production ? [] : StoreDevtoolsModule.instrument(),
    NovelasModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
