import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as usuarioActions from '@store/usuarios/usuarios.actions';
import * as lecturaActions from '@store/lecturas/lecturas.actions';
import * as novelaActions from '@store/novelas/novelas.actions';
import * as usuarioSelectors from '@store/usuarios/usuarios.selectors';
import { catchError, concatMap, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { EMPTY, from, of, Subject } from 'rxjs';
import { IPlayRecursos, UsuariosService } from '@services/usuarios.service';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import { ILectura, ILecturaPost } from '@models/lectura.interfaces';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsuariosEffects {
  constructor(private actions$: Actions, private usuariosService: UsuariosService, private router: Router, private store: Store<AppState>) { }

  /*
  CASO DE USO:
  CUANDO EL USUARIO ENTRA AL SISTEMA Y OBTIENE SU INFORMACION
  */

  login$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.POST_LOGIN),
      mergeMap(
        (action) => this.usuariosService.login(action.payload)
          .pipe(
            map(resp => usuarioActions.POST_LOGIN_SUCCESS({ payload: resp })),
            catchError((err: HttpErrorResponse) => {
              console.log('login$ error', err)
              return of(usuarioActions.POST_LOGIN_ERROR({ payload: err.message }))
            })
          )
      )
    )
  );

  loginSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.POST_LOGIN_SUCCESS),
      map((data) => {
        console.log("LOGIN SUCCESS effect");
        this.usuariosService.saveToken(data.payload.token);
        this.router.navigateByUrl("/novelas");
        return usuarioActions.NO_ACTION();
      })
    )
  );

  logout$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.LOGOUT),
      tap(() => this.usuariosService.clearSession()),
      tap(() => this.router.navigateByUrl("/")),
      map(() => usuarioActions.NO_ACTION())
    )
  );

  getUsuarioById$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.GET_USUARIO_ID, novelaActions.CREATE_NOVELA_SUCCESS),
      map(() => {
        const token = this.usuariosService.readToken();
        const tokenObject = this.usuariosService.decodeJWT(token);

        return tokenObject.userId;
      }),
      mergeMap(
        (userId) => this.usuariosService.getUsuarioById(userId)
          .pipe(
            map(usuario => usuarioActions.GET_USUARIO_ID_SUCCESS({ payload: usuario })),
            catchError((err: HttpErrorResponse) => {
              console.log('getUsuarioById$ error', err)
              return of(usuarioActions.GET_USUARIO_ID_ERROR({ payload: err.message }))
            })
          )
      )
    )
  );

  getUsuarioByIdError$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.GET_USUARIO_ID_ERROR),
      tap(() => this.router.navigateByUrl("/auth/login")),
      map(() => usuarioActions.NO_ACTION())
    )
  );

  playFirstTime$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.PLAY_NOVEL_FIRST_TIME),
      map(({novelaId}) => {
        let usuarioId: string = "";
        this.store.pipe(select(usuarioSelectors.usuario)).subscribe((usuario) => {
          usuarioId = usuario.id;
        });

        let postLectura: ILecturaPost = {
          lecturaUsuarioId: usuarioId,
          lecturaNovelaId: novelaId
        }

        return postLectura;
      }),
      switchMap(
        (resp) => {
          return [
            lecturaActions.POST_LECTURA({ payload: {...resp} })
          ];
        }
      )
    )
  );

  play$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.PLAY_NOVEL),
      map(({novelaId}) => {

        let lectura: ILectura;

        this.store.pipe(select(usuarioSelectors.usuario)).subscribe((usuario) => {
          const lecturaIndex = usuario.lecturas?.findIndex(lectura => lectura.lecturaNovelaId === novelaId);

          if(lecturaIndex === -1) {
            throw "No se encontró la lectura deseada";
          }

          lectura = usuario!.lecturas![lecturaIndex!];
        });

        return lecturaActions.SET_LECTURA_DATA({payload: lectura!});
      })
    )
  );

}
