import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  if (
    req.url.includes('usuarios/login') ||
    (req.url.includes('usuarios') && req.method == 'POST')
  ) {
    return next(req).pipe(finalize(() => null));
  }

  const token = localStorage.getItem('token');

  if (token) {
    req = req.clone({
      setHeaders: {
        authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    finalize(() => null),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        console.error('authInterceptor: Error 401');
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    })
  );
};
