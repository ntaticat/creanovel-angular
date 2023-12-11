import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ILoginPost, IToken, ITokenData } from '@models/usuario.interfaces';
import { map, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  url = environment.url;

  constructor(private http: HttpClient) {}

  login(loginPost: ILoginPost) {
    const method = `usuarios/login`;
    return this.http.post<IToken>(`${this.url}/${method}`, loginPost).pipe(
      tap({
        next: resp => this.saveToken(resp.token),
      }),
      map(resp => resp),
      shareReplay()
    );
  }

  clearSession() {
    localStorage.clear();
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  readToken(): string {
    const token = localStorage.getItem('token');
    return token ?? '';
  }

  decodeJWT(token: string): ITokenData {
    const decodeToken = JSON.parse(atob(token.split('.')[1]));
    return decodeToken;
  }

  getTokenExpiration() {
    const token = this.readToken();

    if (token === '') {
      return 0;
    }

    const decodedToken = this.decodeJWT(token);
    return decodedToken.exp;
  }

  isLoggedIn() {
    const now = Math.floor(Date.now() / 1000);
    const exp = this.getTokenExpiration();

    return now < exp;
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }
}
