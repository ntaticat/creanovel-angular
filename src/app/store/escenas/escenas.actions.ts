import { IEscena, IEscenaPost } from "@models/escena.interfaces";
import { createAction, props } from "@ngrx/store";

export const CREATE_ESCENA = createAction(
  '[Novelas] CREATE_ESCENA',
  props<{ payload: IEscenaPost }>()
);

export const CREATE_ESCENA_SUCCESS = createAction(
  '[Novelas] CREATE_ESCENA_SUCCESS',
  props<{ payload: IEscena }>()
);

export const CREATE_ESCENA_ERROR = createAction(
  '[Novelas] CREATE_ESCENA_ERROR',
  props<{ payload: any }>()
);
