import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['role'] as string;

  return toObservable(authService.currentUser).pipe(
    map(user => {
      if (user && user.role === expectedRole) {
        return true;
      }
      void router.navigate(['/dashboard']);
      return false;
    })
  );
};
