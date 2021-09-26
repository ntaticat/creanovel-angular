import { ActionReducerMap } from '@ngrx/store';
import * as novelas from './novelas/novelas.reducer';
import * as usuarios from './usuarios/usuarios.reducer';


export interface AppState {
  novelas: novelas.State,
  usuarios: usuarios.State
}



export const appReducers: ActionReducerMap<AppState> = {
  novelas: novelas.novelasReducer,
  usuarios: usuarios.usuariosReducer
}
