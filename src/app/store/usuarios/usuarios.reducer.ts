import { createReducer, on } from '@ngrx/store';
import { IUsuario } from '@models/usuario.interfaces';
import * as actions from '@store/usuarios/usuarios.actions';

export interface State {
  data: IUsuario;
  error: string;
  isLoading: boolean;
  loadedSuccess: boolean;
  logged: boolean;
};

const initialUsuario: IUsuario = {
  usuarioId: "",
  nombre: "",
  nickname: "",
  correo: "",
  lecturas: [],
  novelasCreadas: []
};

const initialState: State = {
  data: initialUsuario,
  error: '',
  isLoading: false,
  loadedSuccess: false,
  logged: false
};

export const usuariosReducer = createReducer(initialState,
  on(actions.POST_LOGIN, (state) => (
      { ...state, isLoading: true, loadedSuccess: false, logged: false }
  )),
  on(actions.POST_LOGIN_SUCCESS, (state, { payload }) => (
    { ...state, isLoading: false, loadedSuccess: true, logged: true, data: {...payload} }
  )),
  on(actions.POST_LOGIN_ERROR, (state, { payload }) => (
    { ...state, isLoading: false, loadedSuccess: false, logged: false, error: payload }
  )),
  on(actions.READ_USUARIO_DATA, (state) => (
    { ...state, isLoading: true, loadedSuccess: false, logged: false }
  )),
  on(actions.SET_USUARIO_DATA, (state, { payload }) => (
    { ...state, isLoading: false, loadedSuccess: true, logged: true, data: {...payload} }
  ))
);
