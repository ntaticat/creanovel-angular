import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IConversacion, IDecision, IDecisionOpcionPost, IRecurso, IRecursoPost, MixRecursosType } from '@models/recurso.interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecursosService {

  url = environment.url;

  constructor(private http: HttpClient) { }

  getRecurso(recursoId: string): Observable<MixRecursosType> {
    const method =  `${this.url}/recursos/${recursoId}`;

    return this.http.get<IConversacion | IDecision>(method);
  }

  getPrimerRecursoNovela(novelaId: string): Observable<MixRecursosType> {
    const method =  `${this.url}/recursos/first/${novelaId}`;

    return this.http.get<IConversacion | IDecision>(method);
  }

  postRecurso(recursoInfo: MixRecursosType): Observable<{}> {
    const method = `${this.url}/recursos`;

    const request = {
      ...recursoInfo
    }

    return this.http.post(method, request);
  }

  postRecursoSiguiente(recursoId: string, recursoSiguienteId: string): Observable<{}> {
    const method = `${this.url}/recursos/${recursoId}/next/${recursoSiguienteId}`;

    return this.http.post(method, {});
  }

  postRecursoOpcion(opcionInfo: IDecisionOpcionPost): Observable<{}> {
    const method = `${this.url}/recursos/opciones`;

    const request = {
      ...opcionInfo
    }

    return this.http.post(method, method);
  }

  deleteRecurso(recursoId: string): Observable<{}> {
    const method =  `${this.url}/recursos/${recursoId}`;

    return this.http.delete(method);
  }
}
