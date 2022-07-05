import { IConversacion, IDecision } from "@models/recurso.interfaces";
import { createAction, props } from "@ngrx/store";
import { ILectura, ILecturaPost, ILecturaRecursoPost } from "src/app/data/models/lectura.interfaces";

// -----------
// API ACTIONS
// -----------

// Registrar lectura cuando se juega por primera vez una novela
export const POST_LECTURA = createAction(
  '[Lecturas] POST_LECTURA',
  props<{ payload: ILecturaPost }>()
);

export const POST_LECTURA_SUCCESS = createAction(
  '[Lecturas] POST_LECTURA_SUCCESS'
);

export const POST_LECTURA_ERROR = createAction(
  '[Lecturas] POST_LECTURA_ERROR',
  props<{ payload: any }>()
);

// Eliminar registro de lectura
export const DELETE_LECTURA = createAction(
  '[Lecturas] DELETE_LECTURA',
  props<{ payload: string }>()
);

export const DELETE_LECTURA_SUCCESS = createAction(
  '[Lecturas] DELETE_LECTURA_SUCCESS'
);

export const DELETE_LECTURA_ERROR = createAction(
  '[Lecturas] DELETE_LECTURA_ERROR',
  props<{ payload: any }>()
);

// añadir recurso de lectura
export const POST_LECTURA_RECURSO = createAction(
  '[Lecturas] POST_LECTURA_RECURSO',
  props<{ payload: ILecturaRecursoPost }>()
);

export const POST_LECTURA_RECURSO_SUCCESS = createAction(
  '[Lecturas] POST_LECTURA_RECURSO_SUCCESS'
);

export const POST_LECTURA_RECURSO_ERROR = createAction(
  '[Lecturas] POST_LECTURA_RECURSO_ERROR',
  props<{ payload: any }>()
);

// Eliminar recurso de lectura
export const DELETE_LECTURA_RECURSO = createAction(
  '[Lecturas] DELETE_LECTURA_RECURSO',
  props<{ payload: string }>()
);

export const DELETE_LECTURA_RECURSO_SUCCESS = createAction(
  '[Lecturas] DELETE_LECTURA_RECURSO_SUCCESS'
);

export const DELETE_LECTURA_RECURSO_ERROR = createAction(
  '[Lecturas] DELETE_LECTURA_RECURSO_ERROR',
  props<{ payload: any }>()
);

// -------------------
// APPLICATION ACTIONS
// -------------------

export const SET_LECTURA_DATA = createAction(
  '[Lecturas] SET_LECTURA_DATA',
  props<{ payload: ILectura }>()
);

// export const SET_RECURSO_ANTERIOR_ID = createAction(
//   '[Lecturas] SET_RECURSO_ANTERIOR_ID',
//   props<{ payload: string }>()
// );

// export const SET_RECURSO_ANTERIOR = createAction(
//   '[Lecturas] SET_RECURSO_ANTERIOR',
//   props<{ payload: IConversacion | IDecision }>()
// );

// export const SET_RECURSO_ACTUAL_ID = createAction(
//   '[Lecturas] SET_RECURSO_ACTUAL_ID',
//   props<{ payload: string }>()
// );

// export const SET_RECURSO_ACTUAL = createAction(
//   '[Lecturas] SET_RECURSO_ACTUAL',
//   props<{ payload: IConversacion | IDecision }>()
// );
