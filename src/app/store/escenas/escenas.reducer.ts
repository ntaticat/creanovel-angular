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
  escenaId: '',
  recursos: [],
  identificador: '',
  novelaId: '',
  primerEscena: false,
  ultimaEscena: false
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
  on(actions.CREATE_ESCENA_SUCCESS, (state) => (
    {...state, isLoading: false, loadedSuccess: true}
  )),
  on(actions.CREATE_ESCENA_ERROR, (state, {payload}) => (
    {...state, isLoading: false, loadedSuccess: false, error: payload}
  )),
);
