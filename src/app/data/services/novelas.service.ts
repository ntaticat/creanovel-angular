import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from "rxjs/operators";
import { INovela, INovelasResult } from '../models/novela.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NovelasService {

  url = "http://localhost:3000/api";

  constructor(private http: HttpClient) { }

  getNovelas(): Observable<INovela[]> {
    const method = 'novelas';

    return this.http.get<INovelasResult>(`${this.url}/${method}`)
      .pipe(
        map(resp => resp.novelas)
      );
  }
}
