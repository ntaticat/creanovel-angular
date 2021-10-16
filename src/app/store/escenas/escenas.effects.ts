import { NovelasService } from './../../data/services/novelas.service';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as escenaActions from '@store/escenas/escenas.actions';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { EscenasService } from '@services/escenas.service';

@Injectable({
  providedIn: 'root'
})
export class EscenasEffects {
  constructor(private actions$: Actions, private escenasService: EscenasService) { }

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

}
