import {
  IConversacion,
  IDecision,
  MixRecursosType,
} from './recurso.interfaces';

export interface ILectura {
  lecturaId: string;
  novelaRegistrosId: string;
  usuarioPropietarioId: string;
  recursos?: MixRecursosType[];
}

export interface ILecturaPost {
  novelaRegistrosId: string;
  usuarioPropietarioId: string;
}

export interface ILecturaRecursoPost {
  lecturaId: string;
  recursoId: string;
  recursoOrder: number;
}
