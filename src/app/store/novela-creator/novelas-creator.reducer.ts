import { createReducer, on } from '@ngrx/store';
import * as actions from '@store/novela-creator/novelas-creator.actions';
import { INovela } from '@models/novela.interfaces';
import { IEscena } from '@models/escena.interfaces';
import { IRecurso } from '@models/recurso.interfaces';

export interface State {
  creatorNovela?: INovela;
  creatorEscena?: IEscena;
  creatorRecurso?: IRecurso;
  loading: boolean;
  error: string;
};

const initialState: State = {
  creatorNovela: undefined,
  creatorEscena: undefined,
  creatorRecurso: undefined,
  loading: false,
  error: ""
};

export const novelasCreatorReducer = createReducer(initialState,
  on(actions.GET_CREATOR_NOVELA, (state) => (
    { ...state, loading: true }
  )),
  on(actions.GET_CREATOR_NOVELA_SUCCESS, (state, { payload }) => (
    { ...state, creatorNovela: { ...payload }, loading: false }
  )),
  on(actions.GET_CREATOR_NOVELA_ERROR, (state, { payload }) => (
    { ...state, novela: undefined, loading: false, error: payload }
  )),

  on(actions.GET_CREATOR_ESCENA, (state) => (
    { ...state, loading: true }
  )),
  on(actions.GET_CREATOR_ESCENA_SUCCESS, (state, { payload }) => (
    { ...state, creatorEscena: { ...payload }, loading: false }
  )),
  on(actions.GET_CREATOR_ESCENA_ERROR, (state, { payload }) => (
    { ...state, novela: undefined, loading: false, error: payload }
  ))
);
