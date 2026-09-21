import { IEstadoJuego } from './motor.interfaces';

export interface ILecturaRecursoEntry {
  lecturaId: string;
  recursoId: string;
  recursoOrder: number;
}

export interface ILectura {
  lecturaId: string;
  novelaRegistrosId: string;
  usuarioPropietarioId: string;
  recursos?: ILecturaRecursoEntry[];
  /** Partida guardada (motor). Las lecturas anteriores al motor traen `{}` y sin recurso actual. */
  estado?: IEstadoJuego | null;
  recursoActualId?: string | null;
  novelaVersionId?: string | null;
}

export interface ILecturaPost {
  novelaRegistrosId: string;
  usuarioPropietarioId: string;
  novelaVersionId?: string;
}

export interface ILecturaEstadoPut {
  estado: IEstadoJuego;
  recursoActualId?: string | null;
  novelaVersionId?: string | null;
}

export interface ILecturaRecursoPost {
  lecturaId: string;
  recursoId: string;
  recursoOrder: number;
}
