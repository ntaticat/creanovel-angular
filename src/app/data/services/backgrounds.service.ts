import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IBackground,
  IBackgroundPost,
  IBackgroundSpritePost,
} from '@models/background.interfaces';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BackgroundsService {
  url = environment.url;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }

  getBackgrounds(): Observable<IBackground[]> {
    const method = `${this.url}/backgrounds`;

    return this.http
      .get<IBackground[]>(method)
      .pipe(retry(3), catchError(this.handleError));
  }

  getBackground(backgroundId: string): Observable<IBackground> {
    const method = `${this.url}/backgrounds/${backgroundId}`;

    return this.http.get<IBackground>(method);
  }

  postBackground(data: IBackgroundPost): Observable<string> {
    const method = `${this.url}/backgrounds`;

    return this.http.post<string>(method, data);
  }

  patchBackground(backgroundId: string, data: Partial<IBackgroundPost>): Observable<{}> {
    const method = `${this.url}/backgrounds/${backgroundId}`;

    return this.http.patch(method, data);
  }

  deleteBackground(backgroundId: string): Observable<{}> {
    const method = `${this.url}/backgrounds/${backgroundId}`;

    return this.http.delete(method);
  }

  postBackgroundSprite(data: IBackgroundSpritePost): Observable<string> {
    const method = `${this.url}/backgrounds/sprites`;

    return this.http.post<string>(method, data);
  }

  deleteBackgroundSprite(backgroundSpriteId: string): Observable<{}> {
    const method = `${this.url}/backgrounds/sprites/${backgroundSpriteId}`;

    return this.http.delete(method);
  }
}
