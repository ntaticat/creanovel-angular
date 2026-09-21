import { Routes } from '@angular/router';
import { authGuard } from 'src/app/core/guards/auth.guard';

export const PLAYING_NOVELA_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./playing-novela-page/playing-novela-page.component').then(
        m => m.PlayingNovelaPageComponent
      ),
    canActivate: [authGuard],
  },
  { path: '**', pathMatch: 'full', redirectTo: '/novelas' },
];
