import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthFacade } from '@data/facade/auth.facade';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap, take, map, Observable } from 'rxjs';

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  const isInitialized$ = toObservable(authFacade.isInitialized);
  const isAuthenticated$ = toObservable(authFacade.isAuthenticated);

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
