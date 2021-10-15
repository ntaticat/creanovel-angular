import { ILectura } from "./lectura.interfaces";
import { INovela } from "./novela.interfaces";

export interface ILoginPost {
  nickname: string;
  password: string;
}

export interface IUsuario {
  usuarioId: string;
  nombre: string;
  correo: string;
  nickname: string;
  lecturas?: ILectura[];
  novelasCreadas?: INovela[];
}

export interface IUsuarioPost {
  nombre: string;
  correo: string;
  nickname: string;
  password: string;
}
