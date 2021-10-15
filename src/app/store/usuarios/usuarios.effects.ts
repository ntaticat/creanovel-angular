import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as usuarioActions from '@store/usuarios/usuarios.actions';
import * as lecturaActions from '@store/lecturas/lecturas.actions';
import * as usuarioSelectors from '@store/usuarios/usuarios.selectors';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { EMPTY, from, of, Subject } from 'rxjs';
import { IPlayRecursos, UsuariosService } from '@services/usuarios.service';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import { ILectura, ILecturaPost } from '@models/lectura.interfaces';

@Injectable({
  providedIn: 'root'
})
export class UsuariosEffects {
  constructor(private actions$: Actions, private usuariosService: UsuariosService, private router: Router, private store: Store<AppState>) { }

  /*
  CASO DE USO:
  CUANDO EL USUARIO ENTRA AL SISTEMA Y OBTIENE SU INFORMACION
  */
  getUsuarioById$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.POST_LOGIN),
      mergeMap(
        (resp) => this.usuariosService.getUsuarioById("1821861C-91AA-4BA8-5E5F-08D98EA1512E")
          .pipe(
            tap((usuario) => this.usuariosService.saveUserData(usuario)),
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

  /*
  CASO DE USO:
  OBTENER USUARIO DEL LOCALSTORAGE (SUSTITUIR POR INFORMACION DE LA SESION)
  */
  readUsuarioData$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.READ_USUARIO_DATA),
      mergeMap(
        () => from(this.usuariosService.readUserData())
          .pipe(
            map(usuario => usuarioActions.SET_USUARIO_DATA({ payload: usuario }))
          )
      )
    )
  );

  playFirstTime$ = createEffect(
    () => this.actions$.pipe(
      ofType(usuarioActions.PLAY_NOVEL_FIRST_TIME),
      map(({novelaId}) => {
        let usuarioId: string = "";
        this.store.pipe(select(usuarioSelectors.usuario)).subscribe((usuario) => {
          usuarioId = usuario.usuarioId;
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
