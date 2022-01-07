import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as usuarios from "./usuarios.reducer";

const featureKey = 'usuarios';
const selectUsuario = createFeatureSelector<AppState, usuarios.State>(featureKey);

export const usuario = createSelector(
  selectUsuario,
  (state: usuarios.State) => state.data
);

export const loading = createSelector(
  selectUsuario,
  (state: usuarios.State) => state.isLoading
);

export const userLoaded = createSelector(
  selectUsuario,
  (state: usuarios.State) => state.userLoaded
);

export const error = createSelector(
  selectUsuario,
  (state: usuarios.State) => state.error
);
