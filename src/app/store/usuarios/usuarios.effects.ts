import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as usuarioActions from './usuarios.actions';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UsuariosService } from 'src/app/data/services/usuarios.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UsuariosEffects {
  constructor(private actions$: Actions, private usuariosService: UsuariosService, private router: Router) { }

  getUsuarioById$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.POST_LOGIN),
      mergeMap(
        (resp) => this.usuariosService.getUsuarioById("d4141f1e-7d2d-42de-ff8c-08d980ababbf")
          .pipe(
            map(usuario => usuarioActions.POST_LOGIN_SUCCESS({ payload: usuario })),
            tap(() => this.router.navigateByUrl("/novelas")),
            catchError(err => {
              console.log('Error en getNovelas effect', err)
              return of(usuarioActions.POST_LOGIN_ERROR({ payload: err }))
            })
          )
      )
    )
  );

}
