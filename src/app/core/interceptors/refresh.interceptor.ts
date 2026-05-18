import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError, switchMap } from 'rxjs';
import { AuthFacade } from '@data/facade/auth.facade';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (req.url.includes('/refresh')) {
          authFacade.handleRefreshFailure();
          return throwError(() => error);
        }

        return authFacade.refresh().pipe(
          switchMap(newToken => {
            if (newToken) {
              const clonedRequest = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(clonedRequest);
            }
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    }),
  );
};
