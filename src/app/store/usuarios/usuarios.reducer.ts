import { createReducer, on } from '@ngrx/store';
import { IUsuario, IUsuarioPost } from 'src/app/data/models/usuario.interfaces';
import * as actions from 'src/app/store/usuarios/usuarios.actions';

export interface State {
  object: IUsuario;
  error: string;
  isLoading: boolean;
  loadedSuccess: boolean;
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
  object: initialUsuario,
  error: '',
  isLoading: false,
  loadedSuccess: false
};

export const usuariosReducer = createReducer(initialState,
  on(actions.POST_LOGIN, (state, { payload }) => (
      { ...state, isLoading: true, loadedSuccess: false }
  )),
  on(actions.POST_LOGIN_SUCCESS, (state, { payload }) => (
    { ...state, isLoading: false, loadedSuccess: true, object: {...payload} }
  )),
  on(actions.POST_LOGIN_ERROR, (state, { payload }) => (
    { ...state, isLoading: false, loadedSuccess: false, error: payload }
  ))
);
