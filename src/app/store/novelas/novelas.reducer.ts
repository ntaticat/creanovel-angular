import { createReducer, on } from '@ngrx/store';
import { INovela } from '@models/novela.interfaces';
import * as actions from './novelas.actions';

export interface State {
  array: INovela[];
  object: INovela;
  error: string;
  isLoading: boolean;
  loadedSuccess: boolean;
};

const initialObject: INovela = {
  disponible: false,
  descripcion: '',
  titulo: '',
  usuarioCreadorId: '',
  novelaId: '',
  escenas: []
};

const initialState: State = {
  array: [],
  object: {...initialObject},
  error: '',
  isLoading: false,
  loadedSuccess: false
};

export const novelasReducer = createReducer(initialState,
  on(actions.GET_NOVELAS, (state) => (
      {...state, isLoading: true, loadedSuccess: false}
  )),
  on(actions.GET_NOVELAS_SUCCESS, (state, { payload }) => (
      {...state, isLoading: false, loadedSuccess: true, array: payload}
  )),
  on(actions.GET_NOVELAS_ERROR, (state, { payload }) => (
      {...state, isLoading: false, loadedSuccess: false, error: payload}
  )),

  on(actions.GET_NOVELA, (state) => (
    {...state, isLoading: true, loadedSuccess: false}
  )),
  on(actions.GET_NOVELA_SUCCESS, (state, { payload }) => (
      {...state, isLoading: false, loadedSuccess: true, object: payload}
  )),
  on(actions.GET_NOVELA_ERROR, (state, { payload }) => (
      {...state, isLoading: false, loadedSuccess: false, error: payload}
  )),

  on(actions.CREATE_NOVELA, (state) => (
    {...state, isLoading: true, loadedSuccess: false}
  )),
  on(actions.CREATE_NOVELA_SUCCESS, (state) => (
    {...state, isLoading: false, loadedSuccess: true}
  )),
  on(actions.CREATE_NOVELA_ERROR, (state, {payload}) => (
    {...state, isLoading: false, loadedSuccess: false, error: payload}
  )),
);
