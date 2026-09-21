import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { MainPageComponent } from './layouts/main-page/main-page.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      {
        path: '',
        component: MainPageComponent,
        pathMatch: 'full',
      },
      {
        path: 'novelas',
        loadChildren: () =>
          import('./modules/novelas/novelas.routes').then(
            m => m.NOVELAS_ROUTES
          ),
      },
      {
        path: 'novelas-creator',
        loadChildren: () =>
          import('./modules/novelas-creator/novelas-creator.routes').then(
            m => m.NOVELAS_CREATOR_ROUTES
          ),
      },
      {
        path: 'play',
        loadChildren: () =>
          import('./modules/playing-novela/playing-novela.routes').then(
            m => m.PLAYING_NOVELA_ROUTES
          ),
      },
      {
        path: 'preview',
        loadChildren: () =>
          import('./modules/testing-novela/testing-novela.routes').then(
            m => m.TESTING_NOVELA_ROUTES
          ),
      },
    ],
  },

  {
    path: 'auth',
    component: AppComponent,
    loadChildren: () =>
      import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  { path: '**', redirectTo: '/auth/login', pathMatch: 'full' },
];
