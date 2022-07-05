import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as novelasCreatorActions from './novelas-creator.actions';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import { NovelasService } from '@services/novelas.service';
import { EscenasService } from '@services/escenas.service';

@Injectable({
  providedIn: 'root'
})
export class NovelasCreatorEffects {
  constructor(private actions$: Actions, private store: Store<AppState>, private novelasService: NovelasService, private escenasService: EscenasService) { }

  // // Cuando se registra una lectura a un usuario
  // USE CASE: CUANDO SE SOLICITA LA NOVELA PARA EDITAR JUNTO A SUS ESCENAS
  getNovelaCreator$ = createEffect(
    () => this.actions$.pipe(
      ofType(novelasCreatorActions.GET_CREATOR_NOVELA),
      mergeMap(
        ({ payload }) => this.novelasService.getNovelaEscenas(payload)
          .pipe(
            map(novela => novelasCreatorActions.GET_CREATOR_NOVELA_SUCCESS({ payload: novela })),
            catchError(err => {
              console.log('Error en getNovelaCreator effect', err)
              return of(novelasCreatorActions.GET_CREATOR_NOVELA_ERROR({ payload: err }))
            })
          )
      )
    )
  );

  getEscenaCreator$ = createEffect(
    () => this.actions$.pipe(
      ofType(novelasCreatorActions.GET_CREATOR_ESCENA),
      mergeMap(
        ({ payload }) => this.escenasService.getEscena(payload)
          .pipe(
            map(escena => novelasCreatorActions.GET_CREATOR_ESCENA_SUCCESS({ payload: escena })),
            catchError(err => {
              console.log('Error en getEscenaCreator effect', err)
              return of(novelasCreatorActions.GET_CREATOR_ESCENA_ERROR({ payload: err }))
            })
          )
      )
    )
  );
}
