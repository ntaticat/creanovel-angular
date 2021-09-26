import { createAction, props } from "@ngrx/store";
import { ILoginPost, IUsuario, IUsuarioPost } from "src/app/data/models/usuario.interfaces";

// LOGIN
export const POST_LOGIN = createAction(
  '[Usuarios] POST_LOGIN',
  props<{ payload: ILoginPost }>()
);

export const POST_LOGIN_SUCCESS = createAction(
  '[Usuarios] POST_LOGIN_SUCCESS',
  props<{ payload: IUsuario }>()
);

export const POST_LOGIN_ERROR = createAction(
  '[Usuarios] POST_LOGIN_ERROR',
  props<{ payload: any }>()
);

// CREACION DE USUARIOS
export const POST_USUARIO = createAction(
  '[Usuarios] POST_USUARIO',
  props<{ payload: IUsuarioPost }>()
);

export const POST_USUARIO_SUCCESS = createAction(
  '[Usuarios] POST_USUARIO_SUCCESS',
  props<{ payload: IUsuario }>()
);

export const POST_USUARIO_ERROR = createAction(
  '[Usuarios] POST_USUARIO_ERROR',
  props<{ payload: any }>()
);