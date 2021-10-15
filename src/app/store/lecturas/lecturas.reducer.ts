import { createReducer, on } from '@ngrx/store';
import { ILectura } from '@models/lectura.interfaces';
import { IConversacion, IDecision, IRecurso } from '@models/recurso.interfaces';
import * as actions from '@store/lecturas/lecturas.actions';

export interface State {
  data: ILectura;
  recursoAnteriorId: string;
  recursoAnterior: IConversacion | IDecision;
  recursoActualId: string;
  recursoActual: IConversacion | IDecision;

  error: string;
  isLoading: boolean;
  loadedSuccess: boolean;
};

const initialLectura: ILectura = {
  lecturaId: "",
  lecturaNovelaId: "",
  recursos: [],
  lecturaUsuarioId: ""
}

const initialRecurso: IConversacion = {
  escenaId: "",
  mensaje: "",
  recursoId: "",
  recursoTipo: "",
  siguienteRecursoId: ""
}

const initialState: State = {
  data: {...initialLectura},
  recursoAnteriorId: "",
  recursoActualId: "",
  recursoAnterior: {...initialRecurso},
  recursoActual: {...initialRecurso},

  error: '',
  isLoading: false,
  loadedSuccess: false
};

export const lecturasReducer = createReducer(initialState,

  // CRUD
  on(actions.POST_LECTURA, (state) => (
      {...state, isLoading: true, loadedSuccess: false}
  )),
  on(actions.POST_LECTURA_SUCCESS, (state, { payload }) => (
      {...state, isLoading: false, loadedSuccess: true}
  )),
  on(actions.POST_LECTURA_ERROR, (state, { payload }) => (
      {...state, isLoading: false, loadedSuccess: false, error: payload}
  )),

  on(actions.SET_LECTURA_DATA, (state, { payload }) => (
    {...state, isLoading: false, loadedSuccess: false, data: {...payload}}
  )),


  // WHILE PLAYING
  on(actions.SET_RECURSO_ACTUAL_ID, (state, { payload }) => (
    {...state, recursoActualId: payload}
  )),
  on(actions.SET_RECURSO_ACTUAL, (state, { payload }) => (
    {...state, recursoActual: payload}
  )),
  on(actions.SET_RECURSO_ANTERIOR_ID, (state, { payload }) => (
    {...state, recursoAnteriorId: payload}
  )),
  on(actions.SET_RECURSO_ANTERIOR, (state, { payload }) => (
    {...state, recursoAnterior: payload}
  )),
);
