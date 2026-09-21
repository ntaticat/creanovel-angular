import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type UploadCategory = 'personajes' | 'backgrounds' | 'portadas' | 'objetos';

@Injectable({
  providedIn: 'root',
})
export class UploadsService {
  url = environment.url;

  constructor(private http: HttpClient) {}

  postUpload(file: File, category: UploadCategory): Observable<{ url: string }> {
    const method = `${this.url}/uploads?category=${category}`;

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(method, formData);
  }

  resolveUrl(relativeUrl: string | undefined | null): string {
    if (!relativeUrl) {
      return '';
    }

    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }

    return `${environment.apiOrigin}${relativeUrl}`;
  }
}
