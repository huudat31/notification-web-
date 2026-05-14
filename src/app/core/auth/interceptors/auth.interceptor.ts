import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../store/auth.store';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';

/**
 * Trạng thái refresh token toàn cục cho interceptor
 */
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const accessToken = authStore.accessToken();

  // 1. Thêm Access Token vào Header nếu có
  let authReq = req;
  if (accessToken) {
    authReq = addTokenHeader(req, accessToken);
  }

  // 2. Xử lý request
  return next(authReq).pipe(
    catchError((error) => {
      // Nếu lỗi 401 Unauthorized -> Thực hiện Refresh Token
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(authReq, next, authService, authStore);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Thêm Authorization Header và withCredentials
 */
function addTokenHeader(request: HttpRequest<any>, token: string) {
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
    withCredentials: true
  });
}

/**
 * Xử lý lỗi 401: Refresh Token và Queueing
 */
function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  authStore: AuthStore
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((newToken) => {
        isRefreshing = false;
        refreshTokenSubject.next(newToken);

        // Retry request gốc với token mới
        return next(addTokenHeader(req, newToken));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout(); // Nếu refresh thất bại -> Logout luôn
        return throwError(() => err);
      })
    );
  } else {
    // Nếu đang refresh, cho request này vào hàng đợi (Queue)
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next(addTokenHeader(req, token!)))
    );
  }
}
