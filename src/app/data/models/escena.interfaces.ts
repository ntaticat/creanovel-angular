import { IConversacion, IDecision, IRecurso } from "./recurso.interfaces";

export interface IEscenaPost {
  ndentificador: string;
  novelaId: string;
}

export interface IEscena {
  EscenaId: string;
  novelaId: string;
  ndentificador: string;
  Recursos: (IConversacion | IDecision)[];
}
