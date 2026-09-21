import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { INovelaVersion, INovelaVersionPost } from '@models/novela-version.interfaces';
import { IDefiniciones, IValidacionVersion } from '@models/motor.interfaces';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NovelasVersionesService {
  url = environment.url;

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }

  getNovelaVersion(novelaVersionId: string): Observable<INovelaVersion> {
    const method = `${this.url}/novela-versiones/${novelaVersionId}`;

    return this.http.get<INovelaVersion>(method);
  }

  getNovelaVersiones(novelaId: string): Observable<INovelaVersion[]> {
    const method = `${this.url}/novela-versiones?novelaId=${novelaId}`;

    return this.http
      .get<INovelaVersion[]>(method)
      .pipe(retry(3), catchError(this.handleError));
  }

  postNovelaVersion(data: INovelaVersionPost): Observable<{}> {
    const method = `${this.url}/novela-versiones`;

    return this.http.post(method, data);
  }

  postCrearBorrador(novelaId: string): Observable<string> {
    const method = `${this.url}/novelas/${novelaId}/borrador`;

    return this.http.post<string>(method, {});
  }

  /** Reemplaza el catálogo del motor (variables) de un borrador. Devuelve las definiciones normalizadas. */
  putDefiniciones(
    novelaVersionId: string,
    definiciones: IDefiniciones
  ): Observable<IDefiniciones> {
    const method = `${this.url}/novela-versiones/${novelaVersionId}/definiciones`;

    return this.http.put<IDefiniciones>(method, definiciones);
  }

  /** Errores (bloquean la publicación) y advertencias de una versión. */
  getValidacion(novelaVersionId: string): Observable<IValidacionVersion> {
    const method = `${this.url}/novela-versiones/${novelaVersionId}/validacion`;

    return this.http.get<IValidacionVersion>(method);
  }

  postPublicarVersion(novelaVersionId: string): Observable<{}> {
    const method = `${this.url}/novela-versiones/${novelaVersionId}/publicar`;

    return this.http.post(method, {});
  }
}
