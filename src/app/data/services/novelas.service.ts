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
    const method = `${this.url}/novelas`;

    return this.http.get<INovela[]>(method);
  }

  getNovela(novelaId: string): Observable<INovela> {
    const method = `${this.url}/novelas/${novelaId}`;

    return this.http.get<INovela>(method);
  }

  getNovelaEscenas(novelaId: string): Observable<INovela> {
    const method = `${this.url}/novelas/${novelaId}/escenas`;

    return this.http.get<INovela>(method);
  }

  postNovela(novelaInfo: INovelaPost): Observable<{}> {
    const method = `${this.url}/novelas`;

    const request = {
      ...novelaInfo
    }

    return this.http.post(method, request);
  }

  patchNovela(novelaId: string, novelaInfo: Partial<INovela>): Observable<{}> {
    const method = `${this.url}/novelas/${novelaId}`;

    const request = {
      ...novelaInfo
    }

    return this.http.patch(method, request);
  }

  deleteNovela(novelaId: string): Observable<{}> {
    const method = `${this.url}/novelas/${novelaId}`;

    return this.http.delete(method);
  }


}
