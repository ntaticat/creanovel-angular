import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthGuard } from './core/guards/auth.guard';
import { MainPageComponent } from './layouts/main-page/main-page.component';

const routes: Routes = [


  {
    path: '',
    component: AppComponent,
    children: [
      {
        path: '',
        component: MainPageComponent,
        pathMatch: 'full'
      },
      {
        path: 'novelas',
        loadChildren: () => import('./modules/novelas/novelas.module').then(m => m.NovelasModule)
      },
      {
        path: 'novelas-creator',
        loadChildren: () => import('./modules/novelas-creator/novelas-creator.module').then(m => m.NovelasCreatorModule)
      }
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
