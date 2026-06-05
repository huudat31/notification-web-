import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap, take, map, Observable } from 'rxjs';

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isInitialized$ = toObservable(authService.isInitialized);
  const isAuthenticated$ = toObservable(authService.isAuthenticated);

  return isInitialized$.pipe(
    filter(isInit => isInit === true),
    take(1),
    switchMap(() => isAuthenticated$),
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    })
  );
};
