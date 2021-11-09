import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from "rxjs/operators";
import { INovela, INovelaPost } from '../models/novela.interfaces';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NovelasService {

  url = environment.url;

  constructor(private http: HttpClient) { }

  getNovelas(): Observable<INovela[]> {
    const method = 'novelas';

    return this.http.get<INovela[]>(`${this.url}/${method}`)
      .pipe(
        map(resp => resp)
      );
  }

  postNovela(novelaInfo: INovelaPost): Observable<INovela> {
    const method = 'novelas';

    const request = {
      ...novelaInfo
    }

    return this.http.post<INovela>(`${this.url}/${method}`, request)
      .pipe(
        map(resp => resp)
      );
  }

  getNovela(novelaId: string): Observable<INovela> {
    const method = `novelas/${novelaId}`;

    return this.http.get<INovela>(`${this.url}/${method}`)
      .pipe(
        map(resp => resp)
      );
  }

  getNovelaEscenas(novelaId: string): Observable<INovela> {
    const method = `novelas/${novelaId}/escenas`;

    return this.http.get<INovela>(`${this.url}/${method}`)
      .pipe(
        map(resp => resp)
      );
  }


}
