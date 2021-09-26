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
}
