import { AppState } from './../../store/app.reducer';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {

  userIsLogged: boolean = false;

  constructor(private store: Store<AppState>) {
    this.store.subscribe(({usuarios}) => {
      this.userIsLogged = usuarios.logged;
    });
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    console.log("canLoad", this.userIsLogged);
    return this.userIsLogged;
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      console.log("canActivate", this.userIsLogged);
      return this.userIsLogged;
  }

}
