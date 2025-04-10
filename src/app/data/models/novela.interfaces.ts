import { IBackground } from './background.interfaces';
import { IEscena } from './escena.interfaces';
import { INovelaVersion } from './novela-version.interfaces';
import { IPersonaje } from './personaje.interfaces';

export interface INovela {
  novelaId: string;
  titulo: string;
  descripcion: string;
  disponible: boolean;
  usuarioCreadorId: string;
  escenas?: IEscena[];
  personajes?: IPersonaje[];
  backgrounds?: IBackground[];
  versiones?: INovelaVersion[];
}

export interface INovelaBackgroundPost {
  novelaId: string;
  backgroundId: string;
}

export interface INovelaPersonajePost {
  novelaId: string;
  personajeId: string;
}

export interface INovelaPost {
  titulo: string;
  descripcion: string;
  disponible: boolean;
  usuarioCreadorId: string;
}
