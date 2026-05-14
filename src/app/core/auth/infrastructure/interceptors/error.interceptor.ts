import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError } from 'rxjs';
import { LoggerService } from '../../../services/logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status !== 401) {
          logger.error(
            `HTTP ${error.status} — ${req.method} ${req.url}`,
            { message: error.message },
          );
        }
      } else {
        logger.error('Network/Unknown error', { url: req.url });
      }

      return throwError(() => error);
    }),
  );
};
