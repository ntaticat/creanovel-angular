import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEscena, IEscenaPost } from '@models/escena.interfaces';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EscenasService {
  url = environment.url;

  constructor(private http: HttpClient) {}

  getEscena(escenaId: string): Observable<IEscena> {
    const method = `${this.url}/escenas/${escenaId}`;

    return this.http.get<IEscena>(method);
  }

  postEscena(escenaInfo: IEscenaPost): Observable<{}> {
    const method = `${this.url}/escenas`;

    const request = {
      ...escenaInfo,
    };

    return this.http.post(method, request);
  }

  patchEscena(escenaId: string, escenaInfo: Partial<IEscena>): Observable<{}> {
    const method = `${this.url}/escenas/${escenaId}`;

    const request = {
      ...escenaInfo,
    };

    return this.http.patch(method, request);
  }

  deleteEscena(escenaId: string): Observable<{}> {
    const method = `${this.url}/escenas/${escenaId}`;

    return this.http.delete(method);
  }
}
