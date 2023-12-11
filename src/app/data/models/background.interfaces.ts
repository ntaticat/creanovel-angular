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
