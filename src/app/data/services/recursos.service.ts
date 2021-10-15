import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IConversacion, IDecision, IRecurso } from '@models/recurso.interfaces';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecursosService {

  url = environment.url;

  constructor(private http: HttpClient) { }

  getRecurso(recursoId: string) {
    const method = `recursos/${recursoId}`;
    return this.http.get<IConversacion | IDecision>(`${this.url}/${method}`)
      .pipe(
        map(resp => resp)
      );
  }
}
