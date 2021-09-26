import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

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

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    StoreModule.forRoot(appReducers),
    EffectsModule.forRoot([NovelasEffects, UsuariosEffects]),
    environment.production ? [] : StoreDevtoolsModule.instrument(),
    NovelasModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
