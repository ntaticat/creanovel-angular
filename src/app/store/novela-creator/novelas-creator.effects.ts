import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as novelasCreatorActions from './novelas-creator.actions';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import { EscenasService } from '@services/escenas.service';
import { NovelasService } from '@services/novelas.service';

@Injectable({
  providedIn: 'root'
})
export class NovelasCreatorEffects {
  constructor(private actions$: Actions, private store: Store<AppState>, private novelasService: NovelasService) { }

  // Cuando se registra una lectura a un usuario
  // getNovelaEscenas$ = createEffect(
  //   () => this.actions$.pipe(
  //     ofType(novelasCreatorActions.SET_NOVELA),
  //     mergeMap(
  //       ({ payload }) => this.novelasService.getNovelaEscenas(payload)
  //         .pipe(
  //           map(dbNovela => novelasCreatorActions.SET_NOVELA_SUCCESS({ payload: dbNovela })),
  //           catchError(err => {
  //             console.log('Error en getNovelas effect', err)
  //             return of(novelasCreatorActions.SET_NOVELA_ERROR({ payload: err }))
  //           })
  //         )
  //     )
  //   )
  // );
}
