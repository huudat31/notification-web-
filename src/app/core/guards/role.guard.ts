import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '@data/facade/auth.facade';
import { toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route, state) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);
  const expectedRole = route.data['role'] as string;

  return toObservable(authFacade.currentUser).pipe(
    map(user => {
      if (user && user.role === expectedRole) {
        return true;
      }
      void router.navigate(['/dashboard']);
      return false;
    })
  );
};
