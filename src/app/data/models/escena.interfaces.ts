import { IConversacion, IDecision } from "./recurso.interfaces";

export interface IEscenaPost {
  identificador: string;
  novelaId: string;
}

export interface IEscena {
  EscenaId: string;
  novelaId: string;
  identificador: string;
  Recursos: (IConversacion | IDecision)[];
}
