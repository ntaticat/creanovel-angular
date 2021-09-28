import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from "rxjs/operators";
import { INovela } from '../models/novela.interface';
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
}
