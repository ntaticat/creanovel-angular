import { ActionReducerMap } from '@ngrx/store';
import * as novelas from './novelas/novelas.reducer';
import * as usuarios from './usuarios/usuarios.reducer';
import * as lecturas from './lecturas/lecturas.reducer';


export interface AppState {
  novelas: novelas.State,
  usuarios: usuarios.State,
  lecturas: lecturas.State
}



export const appReducers: ActionReducerMap<AppState> = {
  novelas: novelas.novelasReducer,
  usuarios: usuarios.usuariosReducer,
  lecturas: lecturas.lecturasReducer
}
