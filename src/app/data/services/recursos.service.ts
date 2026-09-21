import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IDecisionOpcionPost,
  IRecursoConversacionPost,
  IRecursoGenericoPost,
  IRecursoDecisionPost,
  IRecursoEntradaPost,
  MixRecursosType,
} from '@models/recurso.interfaces';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecursosService {
  url = environment.url;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `,
        error.error
      );
    }
    // Return an observable with a user-facing error message.
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }

  getRecurso(recursoId: string): Observable<MixRecursosType> {
    const method = `${this.url}/recursos/${recursoId}`;

    return this.http.get<MixRecursosType>(method);
  }

  postRecursoConversacion(data: IRecursoConversacionPost): Observable<string> {
    const method = `${this.url}/recursos/conversacion`;

    return this.http.post<string>(method, data);
  }

  postRecursoDecision(data: IRecursoDecisionPost): Observable<string> {
    const method = `${this.url}/recursos/decision`;

    return this.http.post<string>(method, data);
  }

  patchRecursoConversacion(
    recursoId: string,
    data: Partial<IRecursoConversacionPost>
  ): Observable<{}> {
    const method = `${this.url}/recursos/conversacion/${recursoId}`;

    return this.http.patch(method, data);
  }

  patchRecursoDecision(
    recursoId: string,
    data: Partial<IRecursoDecisionPost>
  ): Observable<{}> {
    const method = `${this.url}/recursos/decision/${recursoId}`;

    return this.http.patch(method, data);
  }

  postRecursoEntrada(data: IRecursoEntradaPost): Observable<string> {
    const method = `${this.url}/recursos/entrada`;

    return this.http.post<string>(method, data);
  }

  patchRecursoEntrada(
    recursoId: string,
    data: Partial<IRecursoEntradaPost>
  ): Observable<{}> {
    const method = `${this.url}/recursos/entrada/${recursoId}`;

    return this.http.patch(method, data);
  }

  /** Crea un recurso con contenido validado por el motor (Evalua, Asigna). */
  postRecurso(data: IRecursoGenericoPost): Observable<string> {
    const method = `${this.url}/recursos`;

    return this.http.post<string>(method, data);
  }

  patchRecurso(
    recursoId: string,
    data: Partial<IRecursoGenericoPost>
  ): Observable<{}> {
    const method = `${this.url}/recursos/${recursoId}`;

    return this.http.patch(method, data);
  }

  postRecursoSiguiente(
    recursoId: string,
    recursoSiguienteId: string
  ): Observable<{}> {
    const method = `${this.url}/recursos/${recursoId}/next/${recursoSiguienteId}`;

    return this.http.post(method, {});
  }

  postRecursoOpcion(opcionInfo: IDecisionOpcionPost): Observable<{}> {
    const method = `${this.url}/recursos/opciones`;

    const request = {
      ...opcionInfo,
    };

    return this.http.post(method, request);
  }

  patchRecursoOpcion(
    recursoDecisionOpcionId: string,
    data: Partial<IDecisionOpcionPost>
  ): Observable<{}> {
    const method = `${this.url}/recursos/opciones/${recursoDecisionOpcionId}`;

    return this.http.patch(method, data);
  }

  deleteRecursoOpcion(recursoDecisionOpcionId: string): Observable<{}> {
    const method = `${this.url}/recursos/opciones/${recursoDecisionOpcionId}`;

    return this.http.delete(method);
  }

  deleteRecurso(recursoId: string): Observable<{}> {
    const method = `${this.url}/recursos/${recursoId}`;

    return this.http
      .delete(method)
      .pipe(retry(3), catchError(this.handleError));
  }
}
