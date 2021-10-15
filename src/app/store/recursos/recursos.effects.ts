import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import * as lecturaActions from '@store/lecturas/lecturas.actions';
import { RecursosService } from '@services/recursos.service';


@Injectable({
  providedIn: 'root'
})
export class RecursosEffects {
  constructor(private actions$: Actions, private recursosService: RecursosService) { }

  setRecursoActualLectura$ = createEffect(
    () => this.actions$.pipe(
      ofType(lecturaActions.SET_RECURSO_ACTUAL_ID),
      mergeMap(
        ({payload}) => this.recursosService.getRecurso(payload)
          .pipe(
            tap((dbRecurso) => console.log("RECURSO ACTUAL", dbRecurso)),
            map(dbRecurso => lecturaActions.SET_RECURSO_ACTUAL({ payload: dbRecurso })),
          )
      )
    )
  );

  setRecursoAnteriorLectura$ = createEffect(
    () => this.actions$.pipe(
      ofType(lecturaActions.SET_RECURSO_ANTERIOR_ID),
      mergeMap(
        ({payload}) => this.recursosService.getRecurso(payload)
          .pipe(
            tap((dbRecurso) => console.log("RECURSO ANTERIOR", dbRecurso)),
            map(dbRecurso => lecturaActions.SET_RECURSO_ANTERIOR({ payload: dbRecurso }))
          )
      )
    )
  );
}
