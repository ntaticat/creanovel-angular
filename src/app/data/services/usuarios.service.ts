import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IUsuario } from '../models/usuario.interfaces';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  url = environment.url;

  constructor(private http: HttpClient) { }

  getUsuarioById(usuarioId: string): Observable<IUsuario> {
    const method = `usuarios/${usuarioId}`;

    return this.http.get<IUsuario>(`${this.url}/${method}`)
      .pipe(
        map(resp => resp)
      );
  }

  async saveUserData(userData: IUsuario) {
    localStorage.setItem("user", JSON.stringify(userData));
  }

  async readUserData(): Promise<IUsuario> {
    const userData = localStorage.getItem("user");
    if(userData) {
      return JSON.parse(userData);
    }
    else {
      const usuario: IUsuario = {
        usuarioId: "",
        nombre: "",
        nickname: "",
        correo: "",
        lecturas: [],
        novelasCreadas: []
      }
      return usuario;
    }
  }

  getUltimoRecurso(novelaId: string, usuario: IUsuario): IPlayRecursos {
    const novelaIndex = usuario.lecturas?.findIndex(lectura => lectura.lecturaNovelaId === novelaId);
    const { recursos } = usuario.lecturas![novelaIndex!];

    const recursoActualId = recursos![recursos?.length! - 1].recursoId;
    const recursoAnteriorId = recursos?.length! > 1? recursos![recursos?.length! - 2].recursoId : undefined;

    return {
      recursoAnteriorId,
      recursoActualId
    }
  }
}

export interface IPlayRecursos {
  recursoAnteriorId?: string;
  recursoActualId: string;
}
