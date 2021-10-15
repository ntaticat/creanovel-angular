import { createAction, props } from "@ngrx/store";
import { INovela } from "@models/novela.interfaces";
import { ILoginPost, IUsuario, IUsuarioPost } from "src/app/data/models/usuario.interfaces";

// -------- AUTENTICACION -------- //

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

// -------- MODO LECTURA -------- //

export const PLAY_NOVEL_FIRST_TIME = createAction(
  '[Usuarios] PLAY_NOVEL_FIRST_TIME',
  props<{ novelaId: string }>()
);

export const PLAY_NOVEL = createAction(
  '[Usuarios] PLAY_NOVEL',
  props<{ novelaId: string }>()
);


// Obtener usuario del localstorage
export const READ_USUARIO_DATA = createAction(
  '[Usuarios] READ_USUARIO_DATA'
);

export const SET_USUARIO_DATA = createAction(
  '[Usuarios] SET_USUARIO_DATA',
  props<{ payload: IUsuario }>()
);



// -------- MODO CREADOR -------- //

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
