import { IConversacion, IDecision } from "./recurso.interfaces";

export interface IEscenaPost {
  identificador: string;
  novelaId: string;
}

export interface IEscena {
  escenaId: string;
  novelaId: string;
  identificador: string;
  recursos: (IConversacion | IDecision)[];
}
