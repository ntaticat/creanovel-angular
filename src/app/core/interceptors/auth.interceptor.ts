import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { UsuariosService } from '@services/usuarios.service';
import { EMPTY, from, Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (
      req.url.includes('usuarios/login') ||
      (req.url.includes('usuarios') && req.method == 'POST')
    ) {
      return next.handle(req).pipe(finalize(() => null));
    }

    const token = localStorage.getItem('token');

    if (token) {
      req = req.clone({
        setHeaders: {
          authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req).pipe(
      finalize(() => null),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          console.error('AuthInterceptor: Error 401');
          this.router.navigateByUrl('/login');
        }
        return throwError(err);
      })
    );
  }
}
