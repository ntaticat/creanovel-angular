import { IEscena } from "./escena.interfaces";

export interface INovela {
  novelaId: string;
  titulo: string;
  descripcion: string;
  disponible: boolean;
  usuarioCreadorId: string;
  escenas: IEscena[];
}

export interface INovelaPost {
  titulo: string;
  descripcion: string;
  disponible: boolean;
  usuarioCreadorId: string;
}
