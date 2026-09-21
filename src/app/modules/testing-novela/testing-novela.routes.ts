import { Routes } from '@angular/router';
import { authGuard } from 'src/app/core/guards/auth.guard';

export const TESTING_NOVELA_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./testing-novela-page/testing-novela-page.component').then(
        m => m.TestingNovelaPageComponent
      ),
    canActivate: [authGuard],
  },
  { path: '**', pathMatch: 'full', redirectTo: '/novelas-creator' },
];
