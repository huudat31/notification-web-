import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthFacade } from '../facade/auth.facade';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap, take, map, Observable } from 'rxjs';

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  // Convert signals to observables for RxJS flow
  const isInitialized$ = toObservable(authFacade.isInitialized);
  const isAuthenticated$ = toObservable(authFacade.isAuthenticated);

  // We must wait until the app has finished initializing auth (restoring session)
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
