import { NovelasService } from './../../data/services/novelas.service';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as novelaActions from './novelas.actions';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NovelasEffects {
  constructor(private actions$: Actions, private novelasService: NovelasService) { }

  getNovelas$ = createEffect(
    () => this.actions$.pipe(
      ofType(novelaActions.GET_NOVELAS),
      mergeMap(
        () => this.novelasService.getNovelas()
          .pipe(
            map(novelas => novelaActions.GET_NOVELAS_SUCCESS({ payload: novelas })),
            catchError(err => {
              console.log('Error en getNovelas effect', err)
              return of(novelaActions.GET_NOVELAS_ERROR({ payload: err }))
            })
          )
      )
    )
  );

  getNovela$ = createEffect(
    () => this.actions$.pipe(
      ofType(novelaActions.GET_NOVELA),
      mergeMap(
        ({ novelaId }) => this.novelasService.getNovela(novelaId)
          .pipe(
            map(novela => novelaActions.GET_NOVELA_SUCCESS({ payload: novela })),
            catchError(err => {
              console.log('Error en getNovela effect', err)
              return of(novelaActions.GET_NOVELA_ERROR({ payload: err }))
            })
          )
      )
    )
  );

  createNovela$ = createEffect(
    () => this.actions$.pipe(
      ofType(novelaActions.CREATE_NOVELA),
      mergeMap(
        ({payload}) => this.novelasService.postNovela(payload)
          .pipe(
            map(() => novelaActions.CREATE_NOVELA_SUCCESS()),
            catchError(err => {
              console.error('error createNovela effect', err)
              return of(novelaActions.CREATE_NOVELA_ERROR({ payload: err }))
            })
          )
      )
    )
  );

}
