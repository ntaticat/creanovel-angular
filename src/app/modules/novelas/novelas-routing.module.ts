import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { NovelasModuleLayoutComponent } from 'src/app/layouts/novelas-module-layout/novelas-module-layout.component';
import { NovelaCreatePageComponent } from '../novelas-creator/novela-create-page/novela-create-page.component';
import { NovelaPageComponent } from './novela-page/novela-page.component';
import { NovelasPageComponent } from './novelas-page/novelas-page.component';

const routes: Routes = [
  {
    path: '',
    component: NovelasModuleLayoutComponent,
    children: [
      {
        path: '',
        component: NovelasPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: ':id',
        component: NovelaPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'create',
        component: NovelaCreatePageComponent,
        canActivate: [AuthGuard],
      },
    ],
  },

  { path: '**', pathMatch: 'full', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NovelasRoutingModule {}
