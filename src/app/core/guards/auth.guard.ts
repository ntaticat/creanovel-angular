import { AppState } from '@store/app.reducer';
import { select, Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, Observer, PartialObserver, Subject } from 'rxjs';
import * as usuarioSelectors from '@store/usuarios/usuarios.selectors';
import * as usuarioActions from '@store/usuarios/usuarios.actions';
import { first, skip, take, takeLast, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {

  constructor(private store: Store<AppState>) {}

  async canLoad(route: Route, segments: UrlSegment[]) {
    const result = await this.canAccessObs();
    console.log("-- RESULT ---> CAN LOAD", result);
    return true;
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const result = await this.canAccessObs();
    console.log("-- RESULT ---> CAN ACTIVATE", result);
    return result;
  }

  canAccessObs(): Promise<boolean> {
    return new Promise((resolve) => {
      this.store.pipe(select(usuarioSelectors.userLoaded))
      .pipe(
        take(1),
        tap(resp => console.log("GUARD USER LOADED:", resp)),
      )
      .subscribe((userLoaded) => {
        if(!userLoaded) {
          this.store.dispatch(usuarioActions.GET_USUARIO_ID());
        }
        else {
          resolve(userLoaded)
        }
      });

      this.store.pipe(select(usuarioSelectors.usuario)).pipe(
        skip(1),
        take(1),
        tap(resp => console.log("USUARIO$ VALUE:", resp))
      )
      .subscribe((usuario) => {
        resolve(!!usuario.id);
      });
    });
  }
}
