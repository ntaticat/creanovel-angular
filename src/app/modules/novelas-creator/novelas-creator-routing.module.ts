import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { EscenaCreatorPageComponent } from './escena-creator-page/escena-creator-page.component';
import { NovelaCreatorPageComponent } from './novela-creator-page/novela-creator-page.component';
import { RecursoCreatorPageComponent } from './recurso-creator-page/recurso-creator-page.component';

const routes: Routes = [
  { path: '', component: NovelaCreatorPageComponent, canActivate: [AuthGuard] },
  { path: ':id/escenas', component: EscenaCreatorPageComponent, canActivate: [AuthGuard] },
  { path: ':novelaId/escenas/:escenaId/recursos', component: RecursoCreatorPageComponent, canActivate: [AuthGuard] },
  { path: '**', pathMatch: 'full', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NovelasCreatorRoutingModule { }
