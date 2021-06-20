import { createSelector, createFeatureSelector } from '@ngrx/store';
import * as novelas from "./novelas.reducer";

export const getNovelasState = createFeatureSelector<novelas.State>('novelas');

export const getNovelas = createSelector(
  getNovelasState,
  (state: novelas.State) => state.array
);
