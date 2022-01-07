import { createAction, props } from "@ngrx/store";
import { INovela } from "@models/novela.interfaces";
import { ILoginPost, IToken, IUsuario, IUsuarioPost } from "src/app/data/models/usuario.interfaces";

// -------- AUTENTICACION -------- //

export const LOGOUT = createAction(
  '[Usuarios] LOGOUT'
);

export const NO_ACTION = createAction(
  '[Usuarios] NO_ACTION'
);

export const POST_LOGIN = createAction(
  '[Usuarios] POST_LOGIN',
  props<{ payload: ILoginPost }>()
);

export const POST_LOGIN_SUCCESS = createAction(
  '[Usuarios] POST_LOGIN_SUCCESS',
  props<{ payload: IToken }>()
);

export const POST_LOGIN_ERROR = createAction(
  '[Usuarios] POST_LOGIN_ERROR',
  props<{ payload: string }>()
);

// -------- MODO LECTURA -------- //

export const PLAY_NOVEL_FIRST_TIME = createAction(
  '[Usuarios] PLAY_NOVEL_FIRST_TIME',
  props<{ novelaId: string }>()
);

export const PLAY_NOVEL = createAction(
  '[Usuarios] PLAY_NOVEL',
  props<{ novelaId: string }>()
);

// -------- MODO CREADOR -------- //

// CREACION DE USUARIOS
export const POST_USUARIO = createAction(
  '[Usuarios] POST_USUARIO',
  props<{ payload: IUsuarioPost }>()
);

export const POST_USUARIO_SUCCESS = createAction(
  '[Usuarios] POST_USUARIO_SUCCESS',
  props<{ payload: IToken }>()
);

export const POST_USUARIO_ERROR = createAction(
  '[Usuarios] POST_USUARIO_ERROR',
  props<{ payload: any }>()
);

// OBTENER POR ID
export const GET_USUARIO_ID = createAction(
  '[Usuarios] GET_USUARIO_ID'
);

export const GET_USUARIO_ID_SUCCESS = createAction(
  '[Usuarios] GET_USUARIO_ID_SUCCESS',
  props<{ payload: IUsuario }>()
);

export const GET_USUARIO_ID_ERROR = createAction(
  '[Usuarios] GET_USUARIO_ID_ERROR',
  props<{ payload: string }>()
);
