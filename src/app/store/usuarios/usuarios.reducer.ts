import { createReducer, on } from '@ngrx/store';
import { IUsuario } from '@models/usuario.interfaces';
import * as actions from '@store/usuarios/usuarios.actions';

export interface State {
  data: IUsuario;
  userLoaded: boolean;
  error: string;
  isLoading: boolean;
};

const initialUsuario: IUsuario = {
  id: "",
  nombre: "",
  userName: "",
  email: "",
  lecturas: [],
  novelasCreadas: []
};

const initialState: State = {
  data: {...initialUsuario},
  error: '',
  isLoading: false,
  userLoaded: false
};

export const usuariosReducer = createReducer(initialState,
  on(actions.POST_LOGIN, (state) => (
      { ...state, isLoading: true }
  )),
  on(actions.POST_LOGIN_SUCCESS, (state) => (
    { ...state, isLoading: false }
  )),
  on(actions.POST_LOGIN_ERROR, (state, { payload }) => (
    { ...state, isLoading: false, error: payload }
  )),

  on(actions.GET_USUARIO_ID, (state) => (
    { ...state, isLoading: true }
  )),
  on(actions.GET_USUARIO_ID_SUCCESS, (state, { payload }) => (
    { ...state, isLoading: false, data: {...payload}, userLoaded: true }
  )),
  on(actions.GET_USUARIO_ID_ERROR, (state, { payload }) => (
    { ...state, isLoading: false, error: payload, userLoaded: false }
  )),
);
