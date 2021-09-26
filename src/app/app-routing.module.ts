import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';

const routes: Routes = [
  

  {
    path: '',
    component: AppComponent,
    children: [
      {
        path: 'novelas',
        loadChildren: () => import('./modules/novelas/novelas.module').then(m => m.NovelasModule)
      },
    ]
  },

  {
    path: 'auth',
    component: AppComponent,
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },

  { path: '**', redirectTo: '/auth/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
