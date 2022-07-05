import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as escenas from "@store/escenas/escenas.reducer";

const featureKey = 'escenas';
const selectEscenas = createFeatureSelector<AppState, escenas.State>(featureKey);

export const getEscenas = createSelector(
  selectEscenas,
  (state: escenas.State) => state.array
);

export const getEscena = createSelector(
  selectEscenas,
  (state: escenas.State) => state.object
);

export const getLoadedSuccess = createSelector(
  selectEscenas,
  (state: escenas.State) => state.loadedSuccess
);

export const getLoading = createSelector(
  selectEscenas,
  (state: escenas.State) => state.isLoading
);
