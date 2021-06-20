import { NovelasService } from './../../data/services/novelas.service';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as novelasActions from './novelas.actions';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NovelasEffects {
  constructor(private actions$: Actions, private novelasService: NovelasService) { }

  getNovelas$ = createEffect(
    () => this.actions$.pipe(
      ofType(novelasActions.GET_NOVELAS),
      mergeMap(
        () => this.novelasService.getNovelas()
          .pipe(
            map(novelas => novelasActions.GET_NOVELAS_SUCCESS({ payload: novelas })),
            catchError(err => {
              console.log('Error en getNovelas effect', err)
              return of(novelasActions.GET_NOVELAS_ERROR({ payload: err }))
            })
          )
      )
    )
  );

}
