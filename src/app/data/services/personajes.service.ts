import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IPersonaje,
  IPersonajePost,
  IPersonajeSpritePost,
} from '@models/personaje.interfaces';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PersonajesService {
  url = environment.url;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }

  getPersonajes(): Observable<IPersonaje[]> {
    const method = `${this.url}/personajes`;

    return this.http
      .get<IPersonaje[]>(method)
      .pipe(retry(3), catchError(this.handleError));
  }

  getPersonaje(personajeId: string): Observable<IPersonaje> {
    const method = `${this.url}/personajes/${personajeId}`;

    return this.http.get<IPersonaje>(method);
  }

  postPersonaje(data: IPersonajePost): Observable<string> {
    const method = `${this.url}/personajes`;

    return this.http.post<string>(method, data);
  }

  patchPersonaje(personajeId: string, data: Partial<IPersonajePost>): Observable<{}> {
    const method = `${this.url}/personajes/${personajeId}`;

    return this.http.patch(method, data);
  }

  deletePersonaje(personajeId: string): Observable<{}> {
    const method = `${this.url}/personajes/${personajeId}`;

    return this.http.delete(method);
  }

  postPersonajeSprite(data: IPersonajeSpritePost): Observable<string> {
    const method = `${this.url}/personajes/sprites`;

    return this.http.post<string>(method, data);
  }

  patchPersonajeSprite(
    personajeSpriteId: string,
    data: Partial<IPersonajeSpritePost>
  ): Observable<{}> {
    const method = `${this.url}/personajes/sprites/${personajeSpriteId}`;

    return this.http.patch(method, data);
  }

  deletePersonajeSprite(personajeSpriteId: string): Observable<{}> {
    const method = `${this.url}/personajes/sprites/${personajeSpriteId}`;

    return this.http.delete(method);
  }
}
