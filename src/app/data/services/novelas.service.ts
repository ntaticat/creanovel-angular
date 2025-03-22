import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, retry, tap } from 'rxjs/operators';
import { INovela, INovelaPost } from '../models/novela.interfaces';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NovelasService {
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

  getNovelas(): Observable<INovela[]> {
    const method = `${this.url}/novelas`;

    return this.http
      .get<INovela[]>(method)
      .pipe(retry(3), catchError(this.handleError));
  }

  getNovela(
    novelaId: string,
    hasVersiones: string = 'False',
    hasPersonajes: string = 'False',
    hasBackgrounds: string = 'False'
  ): Observable<INovela> {
    const method = `${this.url}/novelas/${novelaId}?versiones=${hasVersiones}&personajes=${hasPersonajes}&backgrounds=${hasBackgrounds}`;

    return this.http.get<INovela>(method);
  }

  getNovelaEscenas(novelaId: string): Observable<INovela> {
    const method = `${this.url}/novelas/${novelaId}/escenas`;

    return this.http.get<INovela>(method);
  }

  postNovela(novelaInfo: INovelaPost): Observable<{}> {
    const method = `${this.url}/novelas`;

    const request = {
      ...novelaInfo,
    };

    return this.http.post(method, request);
  }

  patchNovela(novelaId: string, novelaInfo: Partial<INovela>): Observable<{}> {
    const method = `${this.url}/novelas/${novelaId}`;

    const request = {
      ...novelaInfo,
    };

    return this.http.patch(method, request);
  }

  deleteNovela(novelaId: string): Observable<{}> {
    const method = `${this.url}/novelas/${novelaId}`;

    return this.http.delete(method);
  }
}
