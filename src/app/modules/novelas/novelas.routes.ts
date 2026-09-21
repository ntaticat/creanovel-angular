import { Routes } from '@angular/router';
import { authGuard } from 'src/app/core/guards/auth.guard';
import { NovelasModuleLayoutComponent } from 'src/app/layouts/novelas-module-layout/novelas-module-layout.component';
import { userDataResolver } from 'src/app/core/resolvers/user-data.resolver';

export const NOVELAS_ROUTES: Routes = [
  {
    path: '',
    component: NovelasModuleLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./novelas-page/novelas-page.component').then(
            m => m.NovelasPageComponent
          ),
        canActivate: [authGuard],
        resolve: { usuarioData: userDataResolver },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./novela-page/novela-page.component').then(
            m => m.NovelaPageComponent
          ),
        canActivate: [authGuard],
      },
    ],
  },

  { path: '**', pathMatch: 'full', redirectTo: '' },
];
