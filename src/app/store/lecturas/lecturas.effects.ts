import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as lecturaActions from './lecturas.actions';
import * as usuarioActions from '@store/usuarios/usuarios.actions';
import * as usuarioSelectors from '@store/usuarios/usuarios.selectors';
import { LecturasService } from 'src/app/data/services/lecturas.service';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import { IPlayRecursos, UsuariosService } from '@services/usuarios.service';

@Injectable({
  providedIn: 'root'
})
export class LecturasEffects {
  constructor(private actions$: Actions, private lecturasService: LecturasService, private store: Store<AppState>, private usuariosService: UsuariosService) { }

  // Cuando se registra una lectura a un usuario
  postLectura$ = createEffect(
    () => this.actions$.pipe(
      ofType(lecturaActions.POST_LECTURA),
      mergeMap(
        (lecturaPost) => this.lecturasService.postLectura(lecturaPost.payload)
          .pipe(
            map(dbLectura => lecturaActions.POST_LECTURA_SUCCESS({ payload: dbLectura })),
            tap(() => usuarioActions.POST_LOGIN({payload: {email: "123", password: "123"}})),
            catchError(err => {
              console.log('Error en getNovelas effect', err)
              return of(lecturaActions.POST_LECTURA_ERROR({ payload: err }))
            })
          )
      )
    )
  );

  setRecursosValues$ = createEffect(
    () => this.actions$.pipe(
      ofType(lecturaActions.SET_LECTURA_DATA),
      map(({payload}) => {
        const recursosValues: IPlayRecursos = {
          recursoActualId: "",
          recursoAnteriorId: ""
        }

        if(payload.recursos?.length) {
          recursosValues.recursoAnteriorId = payload.recursos.length > 1? payload.recursos[payload.recursos.length - 2].recursoId: "";
          recursosValues.recursoActualId = payload.recursos[payload.recursos.length - 1].recursoId;
        }

        console.log("recursoANterior", recursosValues.recursoAnteriorId);
        console.log("recursoActual", recursosValues.recursoActualId);
        return recursosValues;
      }),
      switchMap(
        (resp) => {
          if(resp?.recursoAnteriorId) {
            return [
              lecturaActions.SET_RECURSO_ACTUAL_ID({payload: resp.recursoActualId}),
              lecturaActions.SET_RECURSO_ANTERIOR_ID({payload: resp.recursoAnteriorId})
            ];
          }
          else {
            return [
              lecturaActions.SET_RECURSO_ACTUAL_ID({payload: resp.recursoActualId})
            ];
          }
        }
      )
    )
  );

  postLecturaRecurso$ = createEffect(
    () => this.actions$.pipe(
      ofType(lecturaActions.POST_LECTURA_RECURSO),
      mergeMap(
        ({payload}) => this.lecturasService.postLecturaRecurso(payload)
          .pipe(
            map(dbLectura => lecturaActions.SET_LECTURA_DATA({ payload: dbLectura }))
          )
      )
    )
  );
}
