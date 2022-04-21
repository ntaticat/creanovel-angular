import { createAction, props } from "@ngrx/store";
import { INovela, INovelaPost } from "@models/novela.interfaces";

export const GET_NOVELAS = createAction(
  '[Novelas] GET_NOVELAS'
);

export const GET_NOVELAS_SUCCESS = createAction(
  '[Novelas] GET_NOVELAS_SUCCESS',
  props<{ payload: INovela[] }>()
);

export const GET_NOVELAS_ERROR = createAction(
  '[Novelas] GET_NOVELAS_ERROR',
  props<{ payload: any }>()
);

export const CREATE_NOVELA = createAction(
  '[Novelas] CREATE_NOVELA',
  props<{ payload: INovelaPost }>()
);

export const CREATE_NOVELA_SUCCESS = createAction(
  '[Novelas] CREATE_NOVELA_SUCCESS'
);

export const CREATE_NOVELA_ERROR = createAction(
  '[Novelas] CREATE_NOVELA_ERROR',
  props<{ payload: any }>()
);

