import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ILectura, ILecturaPost, ILecturaRecursoPost } from '../models/lectura.interfaces';

@Injectable({
  providedIn: 'root'
})
export class LecturasService {

  url = environment.url;

  constructor(private http: HttpClient) { }

  postLectura(lecturaPost: ILecturaPost): Observable<ILectura> {
    const method = 'lecturas';

    const request = {
      ...lecturaPost
    };

    console.log("request", request);

    return this.http.post<ILectura>(`${this.url}/${method}`, request)
      .pipe(
        tap(() => console.log("response", request)),
        map(resp => resp)
      );
  }

  postLecturaRecurso(lecturaRecursoPost: ILecturaRecursoPost) {
    const method = 'lecturas/recursos';

    const request = {
      ...lecturaRecursoPost
    };

    console.log("request", request);

    return this.http.post<ILectura>(`${this.url}/${method}`, request)
      .pipe(
        tap(() => console.log("response", request)),
        map(resp => resp)
      );
  }
}
