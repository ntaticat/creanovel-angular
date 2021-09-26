export interface ILoginPost {
  nickname: string;
  password: string;
}

export interface IUsuario {
  usuarioId: string;
  nombre: string;
  correo: string;
  nickname: string;
  lecturas: any[];
  novelasCreadas: any[];
}

export interface IUsuarioPost {
  nombre: string;
  correo: string;
  nickname: string;
  password: string;
}