import { createReducer, on } from '@ngrx/store';
import { INovela } from 'src/app/data/models/novela.interface';
import * as actions from './novelas.actions';

export interface State {
  array: INovela[];
  error: string;
  isLoading: boolean;
  loadedSuccess: boolean;
};

const initialState: State = {
  array: [],
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
  ))
);
