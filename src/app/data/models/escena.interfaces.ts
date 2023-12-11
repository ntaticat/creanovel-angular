import {
  IConversacion,
  IDecision,
  MixRecursosType,
} from './recurso.interfaces';

export interface IEscenaPost {
  identificador: string;
  novelaId: string;
  primerEscena: boolean;
  ultimaEscena: boolean;
}

export interface IEscena {
  escenaId: string;
  novelaId: string;
  identificador: string;
  primerEscena: boolean;
  ultimaEscena: boolean;
  recursos: MixRecursosType[];
}
