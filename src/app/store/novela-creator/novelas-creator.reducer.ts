import { createReducer, on } from '@ngrx/store';
import * as actions from '@store/novela-creator/novelas-creator.actions';
import { INovela } from '@models/novela.interfaces';
import { IEscena } from '@models/escena.interfaces';
import { IRecurso } from '@models/recurso.interfaces';

export interface State {
  novela?: INovela;
  escena?: IEscena;
  recurso?: IRecurso;
  loading: boolean;
  error: string;
};

const initialState: State = {
  novela: undefined,
  escena: undefined,
  recurso: undefined,
  loading: false,
  error: ""
};

export const novelasCreatorReducer = createReducer(initialState,
//   on(actions.SET_NOVELA, (state) => (
//       {...state, loading: true}
//   )),
//   on(actions.SET_NOVELA_SUCCESS, (state, { payload }) => (
//     {...state, novela: {...payload}, loading: false}
// )),
//   on(actions.SET_NOVELA_ERROR, (state, { payload }) => (
//     {...state, novela: undefined, loading: false, error: payload}
//   )),
//   on(actions.SET_ESCENA, (state, { payload }) => (
//     {...state, escena: {...payload}}
//   )),
//   on(actions.SET_RECURSO, (state, { payload }) => (
//     {...state, recurso: {...payload}}
//   )),
);
