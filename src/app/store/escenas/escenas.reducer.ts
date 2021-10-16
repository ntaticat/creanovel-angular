import { createReducer, on } from '@ngrx/store';
import * as actions from '@store/escenas/escenas.actions';
import { IEscena } from '@models/escena.interfaces';

export interface State {
  array: IEscena[];
  object: IEscena;
  error: string;
  isLoading: boolean;
  loadedSuccess: boolean;
};

const initialObject: IEscena = {
  EscenaId: '',
  Recursos: [],
  identificador: '',
  novelaId: ''
}

const initialState: State = {
  array: [],
  object: {...initialObject},
  error: '',
  isLoading: false,
  loadedSuccess: false
};

export const escenasReducer = createReducer(initialState,
  on(actions.CREATE_ESCENA, (state) => (
    {...state, isLoading: true, loadedSuccess: false}
  )),
  on(actions.CREATE_ESCENA_SUCCESS, (state, {payload}) => (
    {...state, isLoading: false, loadedSuccess: true, object: {...payload}}
  )),
  on(actions.CREATE_ESCENA_ERROR, (state, {payload}) => (
    {...state, isLoading: false, loadedSuccess: false, error: payload}
  )),
);
