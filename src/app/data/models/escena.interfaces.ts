import {
  IConversacion,
  IDecision,
  MixRecursosType,
} from './recurso.interfaces';

export interface IEscenaPost {
  identificador: string;
  novelaVersionId: string;
  primerEscena: boolean;
  ultimaEscena: boolean;
  etiquetas?: string[];
}

export interface IEscena {
  escenaId: string;
  novelaVersionId: string;
  identificador: string;
  primerEscena: boolean;
  ultimaEscena: boolean;
  /** Etiquetas del autor para agrupar/filtrar escenas en el editor (el motor no las usa). */
  etiquetas: string[];
  recursos: MixRecursosType[];
}
