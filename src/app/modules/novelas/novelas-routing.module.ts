import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NovelaPageComponent } from './novela-page/novela-page.component';
import { NovelasPageComponent } from './novelas-page/novelas-page.component';

const routes: Routes = [
  { path: '', component: NovelasPageComponent },
  { path: ':id', component: NovelaPageComponent },
  { path: '**', pathMatch: 'full', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NovelasRoutingModule { }
