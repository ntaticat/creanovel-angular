import { createReducer, on } from '@ngrx/store';
import * as actions from '@store/novela-creator/novelas-creator.actions';
import { INovela } from '@models/novela.interfaces';
import { IEscena } from '@models/escena.interfaces';
import { IRecurso } from '@models/recurso.interfaces';

export interface State {
  novela?: INovela;
  escena?: IEscena;
  recurso?: IRecurso;
};

const initialState: State = {
  novela: undefined,
  escena: undefined,
  recurso: undefined
};

export const novelasCreatorReducer = createReducer(initialState,
  on(actions.SET_NOVELA, (state, { payload }) => (
      {...state, novela: {...payload}}
  )),
  on(actions.SET_ESCENA, (state, { payload }) => (
    {...state, escena: {...payload}}
  )),
  on(actions.SET_RECURSO, (state, { payload }) => (
    {...state, recurso: {...payload}}
  )),
);
