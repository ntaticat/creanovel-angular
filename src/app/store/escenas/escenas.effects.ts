import { NovelasService } from './../../data/services/novelas.service';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as escenaActions from '@store/escenas/escenas.actions';
import { usuarioActions, usuarioSelectors } from '@store/usuarios/usuarios.index';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { EscenasService } from '@services/escenas.service';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as novelaCreatorActions from '@store/novela-creator/novelas-creator.actions';

@Injectable({
  providedIn: 'root'
})
export class EscenasEffects {
  constructor(private actions$: Actions, private escenasService: EscenasService) { }

  createEscena$ = createEffect(
    () => this.actions$.pipe(
      ofType(escenaActions.CREATE_ESCENA),
      mergeMap(
        ({ payload: createEscenaPayload }) => this.escenasService.postEscena(createEscenaPayload)
          .pipe(
            map(() => escenaActions.CREATE_ESCENA_SUCCESS()),
            map(() => novelaCreatorActions.GET_CREATOR_NOVELA({ payload: createEscenaPayload.novelaId })),
            catchError(err => {
              console.error('error createEscena effect', err)
              return of(escenaActions.CREATE_ESCENA_ERROR({ payload: err }))
            })
          )
      )
    )
  );
}
