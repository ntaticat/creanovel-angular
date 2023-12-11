import {
  IUsuarioPost,
  IUsuario,
  IToken,
  ILoginPost,
  ITokenData,
} from '@models/usuario.interfaces';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// TODO: Servicio
@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  url = environment.url;

  constructor(private http: HttpClient) {}

  postUsuario(usuarioPost: IUsuarioPost): Observable<IToken> {
    const method = `usuarios`;

    return this.http
      .post<IToken>(`${this.url}/${method}`, usuarioPost)
      .pipe(map(resp => resp));
  }

  login(loginPost: ILoginPost) {
    const method = `usuarios/login`;
    return this.http
      .post<IToken>(`${this.url}/${method}`, loginPost)
      .pipe(map(resp => resp));
  }

  clearSession() {
    localStorage.clear();
  }

  getUsuarioById(usuarioId: string): Observable<IUsuario> {
    const method = `usuarios/${usuarioId}`;

    return this.http
      .get<IUsuario>(`${this.url}/${method}`)
      .pipe(map(resp => resp));
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  readToken(): string {
    const token = localStorage.getItem('token');
    return token ?? '';
  }

  decodeJWT(token: string): ITokenData {
    const decodeToken = JSON.parse(atob(token.split('.')[1]));
    return decodeToken;
  }

  getUltimoRecurso(novelaId: string, usuario: IUsuario): IPlayRecursos {
    const novelaIndex = usuario.lecturas?.findIndex(
      lectura => lectura.novelaRegistrosId === novelaId
    );
    const { recursos } = usuario.lecturas![novelaIndex!];

    const recursoActualId = recursos![recursos?.length! - 1].recursoId;
    const recursoAnteriorId =
      recursos?.length! > 1
        ? recursos![recursos?.length! - 2].recursoId
        : undefined;

    return {
      recursoAnteriorId,
      recursoActualId,
    };
  }
}

export interface IPlayRecursos {
  recursoAnteriorId?: string;
  recursoActualId: string;
}
