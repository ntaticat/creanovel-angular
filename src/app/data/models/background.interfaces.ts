export interface IBackground {
  backgroundId: string;
  descripcion: string;
  sprites?: IBackgroundSprite[];
}

export interface IBackgroundSprite {
  backgroundSpriteId: string;
  nombre: string;
  direccionImagen: string;
}

export interface IBackgroundPost {
  descripcion: string;
}

export interface IBackgroundSpritePost {
  nombre: string;
  direccionImagen: string;
  backgroundId: string;
}
