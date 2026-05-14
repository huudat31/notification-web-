import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  throwError,
  Observable,
  filter,
  take,
  switchMap,
  catchError,
  timeout,
  retry,
} from 'rxjs';
import { AuthStore } from '../../features/auth/state/auth.store';
import { AuthApiService } from '../../features/auth/infrastructure/api/auth-api.service';
import { TokenStorageService } from '../../features/auth/infrastructure/storage/token.storage';
import { LoggerService } from '../services/logger.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

const AUTH_ENDPOINTS = [
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/google-admin',
];

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  if (AUTH_ENDPOINTS.some(url => req.url.includes(url))) {
    return next(req);
  }

  const authStore = inject(AuthStore);
  const authApi = inject(AuthApiService);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(req, next, authStore, authApi, tokenStorage, router, logger);
      }
      return throwError(() => error);
    }),
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authStore: AuthStore,
  authApi: AuthApiService,
  tokenStorage: TokenStorageService,
  router: Router,
  logger: LoggerService,
): Observable<HttpEvent<unknown>> {

  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);

    const refreshToken = tokenStorage.getRefreshToken();
    const deviceId = tokenStorage.getDeviceId();

    if (!refreshToken) {
      isRefreshing = false;
      refreshSubject.next(null);
      authStore.reset();
      tokenStorage.clearAll();
      void router.navigate(['/login']);
      return throwError(() => new Error('No refresh token available'));
    }

    return authApi.refreshToken({ refreshToken, deviceId }).pipe(
      timeout(10_000),
      retry({ count: 1, delay: 1_000 }),

      switchMap((response: any) => {
        isRefreshing = false;
        authStore.setAuth(response.user, response.accessToken);
        tokenStorage.saveRefreshToken(response.refreshToken);
        refreshSubject.next(response.accessToken);
        logger.log('REFRESH_SUCCESS', { userId: response.user?.id ?? '' });

        return next(req.clone({
          setHeaders: { Authorization: `Bearer ${response.accessToken}` },
        }));
      }),

      catchError((err: unknown) => {
        isRefreshing = false;
        refreshSubject.next(null);
        const status = err instanceof HttpErrorResponse ? err.status : 'timeout';
        logger.log('REFRESH_FAILED', { status: String(status) });
        authStore.reset();
        tokenStorage.clearAll();
        void router.navigate(['/login']);
        return throwError(() => err);
      }),
    ) as Observable<HttpEvent<unknown>>;

  } else {
    return refreshSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(token =>
        next(req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        }))
      ),
    );
  }
}
