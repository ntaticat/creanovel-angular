import { IConversacion, IDecision } from "./recurso.interfaces";

export interface ILectura {
  lecturaId: string;
  lecturaNovelaId: string;
  lecturaUsuarioId: string;
  recursos?: (IConversacion | IDecision)[];
}

export interface ILecturaPost {
  lecturaNovelaId: string;
  lecturaUsuarioId: string;
}

export interface ILecturaRecursoPost {
  lecturaId: string;
  recursoId: string;
}
