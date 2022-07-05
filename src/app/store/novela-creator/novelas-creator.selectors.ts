import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as novelasCreator from "@store/novela-creator/novelas-creator.reducer";

const featureKey = 'novelasCreator';
const selectNovelasCreator = createFeatureSelector<AppState, novelasCreator.State>(featureKey);

export const novela = createSelector(
  selectNovelasCreator,
  (state: novelasCreator.State) => state.creatorNovela
);

export const escena = createSelector(
  selectNovelasCreator,
  (state: novelasCreator.State) => state.creatorEscena
);

export const recurso = createSelector(
  selectNovelasCreator,
  (state: novelasCreator.State) => state.creatorRecurso
);
