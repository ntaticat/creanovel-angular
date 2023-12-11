import { ILectura } from './lectura.interfaces';
import { INovela } from './novela.interfaces';

export interface IUsuario {
  id: string;
  nombre: string;
  email: string;
  userName: string;
  lecturas?: ILectura[];
  novelasCreadas?: INovela[];
}

export interface IToken {
  token: string;
}

export interface ITokenData {
  userId: string;
  exp: number;
}

export interface ILoginPost {
  email: string;
  password: string;
}

export interface IUsuarioPost {
  nombre: string;
  email: string;
  userName: string;
  password: string;
}
