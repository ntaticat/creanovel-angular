import { IConversacion, IDecision } from "./recurso.interfaces";

export interface ILectura {
  lecturaId: string;
  novelaRegistrosId: string;
  usuarioPropietarioId: string;
  recursos?: (IConversacion | IDecision)[];
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
