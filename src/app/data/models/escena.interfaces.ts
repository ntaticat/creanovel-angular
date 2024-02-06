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
}

export interface IEscena {
  escenaId: string;
  novelaVersionId: string;
  identificador: string;
  primerEscena: boolean;
  ultimaEscena: boolean;
  recursos: MixRecursosType[];
}
