import { ActionReducerMap } from '@ngrx/store';
import * as novelas from './novelas/novelas.reducer';


export interface AppState {
  novelas: novelas.State
}



export const appReducers: ActionReducerMap<AppState> = {
  novelas: novelas.novelasReducer
}
