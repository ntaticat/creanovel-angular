import { AppState } from '@store/app.reducer';
import { select, Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import * as usuarioSelectors from '@store/usuarios/usuarios.selectors';
import * as usuarioActions from '@store/usuarios/usuarios.actions';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {

  constructor(private store: Store<AppState>) {}

  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const result = this.getFromStoreOrApi();
    console.log("CANLOAD123", result);
    return result;
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const result = this.getFromStoreOrApi();
      console.log("CANACTIV123", result);
      return result;
  }

  getFromStoreOrApi(): Observable<boolean> {
    this.store.dispatch(usuarioActions.READ_USUARIO_DATA());
    // this.store.dispatch(usuarioActions.POST_LOGIN({payload: {nickname: "", password: ""}}));
    let isLoggedSubject = new Subject<boolean>();
    this.store.pipe(select(usuarioSelectors.logged)).subscribe((logged) => {
      isLoggedSubject.next(logged);
    });

    return isLoggedSubject.asObservable();
  }
}
