import { NovelasService } from './../../data/services/novelas.service';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as escenaActions from '@store/escenas/escenas.actions';
import * as usuarioActions from '@store/usuarios/usuarios.actions';
import * as usuarioSelectors from '@store/usuarios/usuarios.selectors';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { EscenasService } from '@services/escenas.service';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';

@Injectable({
  providedIn: 'root'
})
export class EscenasEffects {
  constructor(private actions$: Actions, private escenasService: EscenasService, private store: Store<AppState>) { }

  createEscena$ = createEffect(
    () => this.actions$.pipe(
      ofType(escenaActions.CREATE_ESCENA),
      mergeMap(
        ({payload}) => this.escenasService.postEscena(payload)
          .pipe(
            map(dbEscena => escenaActions.CREATE_ESCENA_SUCCESS({ payload: dbEscena })),
            catchError(err => {
              console.error('error createEscena effect', err)
              return of(escenaActions.CREATE_ESCENA_ERROR({ payload: err }))
            })
          )
      )
    )
  );

  // validateNuevaEscenaNovelaLecturasUsuario$ = createEffect(
  //   () => this.actions$.pipe(
  //     ofType(escenaActions.CREATE_ESCENA_SUCCESS),
  //     mergeMap(
  //       ({payload}) => {
  //         let novelaExiste: boolean = false;
  //         this.store.pipe(select(usuarioSelectors.usuario)).subscribe((usuario) => {
  //           usuario.novelasCreadas.every((novelaCreada) => {
  //             if(novelaCreada.novelaId === payload.novelaId) {
  //               novelaExiste = true;
  //               return false;
  //             }
  //             return true;
  //           });
  //         });
  //         if(novelaExiste) {
  //           return this.store.dispatch(usuarioActions.READ_USUARIO_DATA());
  //         }

  //         return of({ type: 'NO_ACTION' });
  //       }
  //     )
  //   )
  // );

}
