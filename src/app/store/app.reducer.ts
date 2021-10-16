import { ActionReducerMap } from '@ngrx/store';
import * as usuarios from '@store/usuarios/usuarios.reducer';
import * as lecturas from '@store/lecturas/lecturas.reducer';
import * as novelas from '@store/novelas/novelas.reducer';
import * as escenas from '@store/escenas/escenas.reducer';
import * as novelasCreator from '@store/novela-creator/novelas-creator.reducer';


export interface AppState {
  novelas: novelas.State,
  usuarios: usuarios.State,
  lecturas: lecturas.State,
  escenas: escenas.State,
  novelasCreator: novelasCreator.State
}



export const appReducers: ActionReducerMap<AppState> = {
  novelas: novelas.novelasReducer,
  usuarios: usuarios.usuariosReducer,
  lecturas: lecturas.lecturasReducer,
  escenas: escenas.escenasReducer,
  novelasCreator: novelasCreator.novelasCreatorReducer
}
