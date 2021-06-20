export interface INovela {
  descripcion: string;
  estado: boolean;
  escenas: any[];
  _id: string;
  titulo: string;
}

export interface INovelasResult {
  ok: boolean;
  novelas: INovela[]
}
