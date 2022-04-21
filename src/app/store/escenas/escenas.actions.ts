import { IEscena, IEscenaPost } from "@models/escena.interfaces";
import { createAction, props } from "@ngrx/store";

export const CREATE_ESCENA = createAction(
  '[Escenas] CREATE_ESCENA',
  props<{ payload: IEscenaPost }>()
);

export const CREATE_ESCENA_SUCCESS = createAction(
  '[Escenas] CREATE_ESCENA_SUCCESS'
);

export const CREATE_ESCENA_ERROR = createAction(
  '[Escenas] CREATE_ESCENA_ERROR',
  props<{ payload: any }>()
);
