import { IEscena } from "@models/escena.interfaces";
import { INovela } from "@models/novela.interfaces";
import { IRecurso } from "@models/recurso.interfaces";
import { createAction, props } from "@ngrx/store";

export const SET_NOVELA = createAction(
  '[Novelas Creator] SET_NOVELA',
  props<{ payload: INovela }>()
);

export const SET_ESCENA = createAction(
  '[Novelas Creator] SET_ESCENA',
  props<{ payload: IEscena }>()
);

export const SET_RECURSO = createAction(
  '[Novelas Creator] SET_RECURSO',
  props<{ payload: IRecurso }>()
);


