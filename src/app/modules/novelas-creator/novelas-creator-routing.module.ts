import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { NovelasCreatorModuleLayoutComponent } from 'src/app/layouts/novelas-creator-module-layout/novelas-creator-module-layout.component';
import { NovelaCreatePageComponent } from './novela-create-page/novela-create-page.component';
import { NovelaCreatorPageComponent } from './novela-creator-page/novela-creator-page.component';
import { NovelasCreatorPageComponent } from './novelas-creator-page/novelas-creator-page.component';
import { userDataResolver } from 'src/app/core/resolvers/user-data.resolver';
import { NovelasCreatorDetailPageComponent } from './novelas-creator-detail-page/novelas-creator-detail-page.component';
import { NovelaCreatorVersionesPageComponent } from './novela-creator-versiones-page/novela-creator-versiones-page.component';
import { NovelaCreatorVersionPageComponent } from './novela-creator-version-page/novela-creator-version-page.component';

const routes: Routes = [
  {
    path: '',
    component: NovelasCreatorPageComponent,
    canActivate: [AuthGuard],
    resolve: { usuarioData: userDataResolver },
  },
  {
    path: ':novelaId',
    component: NovelaCreatorPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':novelaId/versiones',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: NovelaCreatorVersionesPageComponent },
      { path: ':versionId', component: NovelaCreatorVersionPageComponent },
    ],
  },
  {
    path: 'create',
    component: NovelaCreatePageComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', pathMatch: 'full', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NovelasCreatorRoutingModule {}
