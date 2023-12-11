import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { AuthService } from '@services/auth.service';
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
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  async canLoad(route: Route, segments: UrlSegment[]) {
    const isLoggedIn = this.authService.isLoggedIn();

    if (!isLoggedIn) {
      this.router.navigateByUrl('/auth/login');
    }

    return isLoggedIn;
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const isLoggedIn = this.authService.isLoggedIn();

    if (!isLoggedIn) {
      this.router.navigateByUrl('/auth/login');
    }

    return isLoggedIn;
  }
}
