import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { PlayingNovelaPageComponent } from './playing-novela-page/playing-novela-page.component';

const routes: Routes = [
  {
    path: ':id',
    component:
    PlayingNovelaPageComponent,
    // canActivate: [AuthGuard]
  },
  { path: '**', pathMatch: 'full', redirectTo: '/novelas' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlayingNovelaRoutingModule { }
