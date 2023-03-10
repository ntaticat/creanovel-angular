import { AppState } from '@store/app.reducer';
import { select, Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import {
  Observable,
  Observer,
  PartialObserver,
  race,
  Subject,
  timer,
} from 'rxjs';
import * as usuarioSelectors from '@store/usuarios/usuarios.selectors';
import * as usuarioActions from '@store/usuarios/usuarios.actions';
import { first, map, mapTo, skip, take, takeLast, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanLoad {
  constructor(private store: Store<AppState>, private router: Router) {}

  async canLoad(route: Route, segments: UrlSegment[]) {
    const result = await this.canAccessObs();

    if (!result) {
      this.router.navigateByUrl('/');
    }

    return result;
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const result = await this.canAccessObs();

    if (!result) {
      this.router.navigateByUrl('/');
    }

    return result;
  }

  canAccessObs(): Promise<boolean> {
    return new Promise((resolve) => {
      this.store
        .pipe(select(usuarioSelectors.userLoaded))
        .pipe(take(1))
        .subscribe((userLoaded) => {
          if (!userLoaded) {
            this.store.dispatch(usuarioActions.GET_USUARIO_ID());
            race(
              this.store.pipe(select(usuarioSelectors.usuario)).pipe(
                skip(1),
                take(1),
                map((usuario) => !!usuario.id)
              ),
              timer(5000).pipe(mapTo(false))
            ).subscribe((value) => {
              resolve(value);
            });
          } else {
            resolve(userLoaded);
          }
        });
    });
  }
}
