import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as lecturas from "@store/lecturas/lecturas.reducer";

const featureKey = 'lecturas';
const selectLectura = createFeatureSelector< lecturas.State>(featureKey);

export const recursoActual = createSelector(
  selectLectura,
  (state: lecturas.State) => state.recursoActual
);

export const loadedSuccess = createSelector(
  selectLectura,
  (state: lecturas.State) => state.loadedSuccess
);

export const lectura = createSelector(
  selectLectura,
  (state: lecturas.State) => state.data
);
