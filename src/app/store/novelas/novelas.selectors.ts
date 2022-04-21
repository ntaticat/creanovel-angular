import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as novelas from "./novelas.reducer";

const featureKey = 'novelas';
const selectNovelas = createFeatureSelector<AppState, novelas.State>(featureKey);

export const getNovelas = createSelector(
  selectNovelas,
  (state: novelas.State) => state.array
);

export const novela = createSelector(
  selectNovelas,
  (state: novelas.State) => state.object
);

export const loadedSuccess = createSelector(
  selectNovelas,
  (state: novelas.State) => state.loadedSuccess
);

export const loading = createSelector(
  selectNovelas,
  (state: novelas.State) => state.isLoading
);
