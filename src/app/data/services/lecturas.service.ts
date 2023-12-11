import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ILectura,
  ILecturaPost,
  ILecturaRecursoPost,
} from '../models/lectura.interfaces';

@Injectable({
  providedIn: 'root',
})
export class LecturasService {
  url = environment.url;

  constructor(private http: HttpClient) {}

  postLectura(lecturaPost: ILecturaPost): Observable<{}> {
    const method = `${this.url}/lecturas`;

    const request = {
      ...lecturaPost,
    };

    return this.http.post(method, request);
  }

  deleteLectura(lecturaId: string): Observable<{}> {
    const method = `${this.url}/lecturas/${lecturaId}`;

    return this.http.delete(method);
  }

  postLecturaRecurso(lecturaRecursoPost: ILecturaRecursoPost): Observable<{}> {
    const method = `${this.url}/lecturas/recursos`;

    const request = {
      ...lecturaRecursoPost,
    };

    return this.http.post(method, request);
  }

  deleteLecturaRecurso(
    lecturaRecursoPost: ILecturaRecursoPost
  ): Observable<{}> {
    const method = `${this.url}/lecturas/recursos`;

    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: { ...lecturaRecursoPost },
    };

    return this.http.delete(method, options);
  }
}
