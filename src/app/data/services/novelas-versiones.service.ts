import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { INovelaVersion } from '@models/novela-version.interfaces';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NovelasVersionesService {
  url = environment.url;

  constructor(private http: HttpClient) { }

  getNovelaVersion(novelaVersionId: string): Observable<INovelaVersion> {
    const method = `${this.url}/novelaVersiones/${novelaVersionId}`;

    return this.http.get<INovelaVersion>(method);
  }
}
