import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
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
import { first, map, mapTo, skip, take, takeLast, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(private router: Router) {}

  async canLoad(route: Route, segments: UrlSegment[]) {
    return true;
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return true;
  }
}
