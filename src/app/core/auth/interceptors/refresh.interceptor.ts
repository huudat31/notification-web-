import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError, switchMap } from 'rxjs';
import { AuthFacade } from '../facade/auth.facade';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        
        // Prevent infinite loop if the refresh endpoint itself returns 401
        if (req.url.includes('/refresh')) {
          authFacade.handleRefreshFailure();
          return throwError(() => error);
        }

        // Delegate to facade for queueing and refreshing logic
        return authFacade.refresh().pipe(
          switchMap(newToken => {
            if (newToken) {
              // Retry the failed request with the new token
              const clonedRequest = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(clonedRequest);
            }
            // If token is null, the refresh failed, let it error out
            return throwError(() => error);
          })
        );
      }
      
      return throwError(() => error);
    }),
  );
};
