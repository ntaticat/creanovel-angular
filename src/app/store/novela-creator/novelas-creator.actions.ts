import { IEscena } from "@models/escena.interfaces";
import { INovela } from "@models/novela.interfaces";
import { IRecurso } from "@models/recurso.interfaces";
import { createAction, props } from "@ngrx/store";

export const GET_CREATOR_NOVELA = createAction(
  '[Novelas Creator] GET_CREATOR_NOVELA',
  props<{ payload: string }>()
);

export const GET_CREATOR_NOVELA_SUCCESS = createAction(
  '[Novelas Creator] GET_CREATOR_NOVELA_SUCCESS',
  props<{ payload: INovela }>()
);

export const GET_CREATOR_NOVELA_ERROR = createAction(
  '[Novelas Creator] GET_CREATOR_NOVELA_ERROR',
  props<{ payload: any }>()
);

export const GET_CREATOR_ESCENA = createAction(
  '[Novelas Creator] GET_CREATOR_ESCENA',
  props<{ payload: string }>()
);

export const GET_CREATOR_ESCENA_SUCCESS = createAction(
  '[Novelas Creator] GET_CREATOR_ESCENA_SUCCESS',
  props<{ payload: IEscena }>()
);

export const GET_CREATOR_ESCENA_ERROR = createAction(
  '[Novelas Creator] GET_CREATOR_ESCENA_ERROR',
  props<{ payload: any }>()
);

export const GET_CREATOR_RECURSO = createAction(
  '[Novelas Creator] GET_CREATOR_RECURSO',
  props<{ payload: string }>()
);

export const GET_CREATOR_RECURSO_SUCCESS = createAction(
  '[Novelas Creator] GET_CREATOR_RECURSO_SUCCESS',
  props<{ payload: IRecurso }>()
);

export const GET_CREATOR_RECURSO_ERROR = createAction(
  '[Novelas Creator] GET_CREATOR_RECURSO_ERROR',
  props<{ payload: any }>()
);
