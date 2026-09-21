import { Routes } from '@angular/router';
import { authGuard } from 'src/app/core/guards/auth.guard';
import { userDataResolver } from 'src/app/core/resolvers/user-data.resolver';

export const NOVELAS_CREATOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./novelas-creator-page/novelas-creator-page.component').then(
        m => m.NovelasCreatorPageComponent
      ),
    canActivate: [authGuard],
    resolve: { usuarioData: userDataResolver },
  },
  {
    // Static segment — must stay before the ":novelaId" param route below,
    // otherwise the router would swallow "personajes" as a novela id.
    path: 'personajes',
    loadComponent: () =>
      import(
        './personajes-library-page/personajes-library-page.component'
      ).then(m => m.PersonajesLibraryPageComponent),
    canActivate: [authGuard],
  },
  {
    // The actual escena/recurso graph editor. It always operates on a
    // NovelaVersionId (the current draft), never on a NovelaId, to avoid the
    // id-type ambiguity the previous single-segment ":novelaId" route had.
    path: 'editor/:novelaVersionId',
    loadComponent: () =>
      import('./novela-creator-page/novela-creator-page.component').then(
        m => m.NovelaCreatorPageComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: ':novelaId',
    loadComponent: () =>
      import(
        './novelas-creator-detail-page/novelas-creator-detail-page.component'
      ).then(m => m.NovelasCreatorDetailPageComponent),
    canActivate: [authGuard],
  },
  { path: '**', pathMatch: 'full', redirectTo: '' },
];
