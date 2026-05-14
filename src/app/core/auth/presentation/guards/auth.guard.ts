import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthStore } from '../../domain/state/auth.store';
export const authGuard: CanActivateFn = (
  _route,
  state,
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const redirectToLogin = (): UrlTree =>
    router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

  if (authStore.isInitialized()) {
    return authStore.isAuthenticated() ? true : redirectToLogin();
  }

  return toObservable(authStore.isInitialized).pipe(
    filter(initialized => initialized === true),
    take(1),
    map(() =>
      authStore.isAuthenticated() ? true : redirectToLogin()
    ),
  );
};
