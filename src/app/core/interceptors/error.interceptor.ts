import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      // Global error handling logic (logging, analytics, etc.)
      console.error('[GLOBAL ERROR]', error);
      return throwError(() => error);
    })
  );
};
