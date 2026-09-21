export interface IPersonaje {
  personajeId: string;
  nombre: string;
  sprites: IPersonajeSprite[];
}

export interface IPersonajeSprite {
  personajeSpriteId: string;
  nombre: string;
  direccionImagen: string;
}

export interface IPersonajePost {
  nombre: string;
}

export interface IPersonajeSpritePost {
  nombre: string;
  direccionImagen: string;
  personajeId: string;
}
