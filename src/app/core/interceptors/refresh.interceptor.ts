import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError, switchMap } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (req.url.includes('/refresh')) {
          authService.handleRefreshFailure();
          console.error('[GLOBAL ERROR]', error);
          return throwError(() => error);
        }

        return authService.refresh().pipe(
          switchMap(newToken => {
            if (newToken) {
              const clonedRequest = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(clonedRequest);
            }
            console.error('[GLOBAL ERROR]', error);
            return throwError(() => error);
          })
        );
      }
      console.error('[GLOBAL ERROR]', error);
      return throwError(() => error);
    }),
  );
};
