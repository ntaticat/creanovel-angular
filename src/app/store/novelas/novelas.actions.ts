import { createAction, props } from "@ngrx/store";
import { INovela } from "src/app/data/models/novela.interface";

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
