import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NovelaComponent } from './components/novela/novela.component';
import { NovelasComponent } from './components/novelas/novelas.component';

const routes: Routes = [
  { path: '', component: NovelasComponent },
  { path: ':id', component: NovelaComponent },
  { path: '**', pathMatch: 'full', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NovelasRoutingModule { }
