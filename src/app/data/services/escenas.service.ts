import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEscena, IEscenaPost } from '@models/escena.interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EscenasService {

  url = environment.url;

  constructor(private http: HttpClient) { }

  postEscena(escenaInfo: IEscenaPost): Observable<IEscena> {
    const method = 'escenas';

    const request = {
      ...escenaInfo
    }

    return this.http.post<IEscena>(`${this.url}/${method}`, request)
      .pipe(
        map(resp => resp)
      );
  }
}
