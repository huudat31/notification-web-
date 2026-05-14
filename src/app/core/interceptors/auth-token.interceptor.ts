import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../../features/auth/state/auth.store';

const AUTH_ENDPOINTS = [
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/google-admin',
];

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (AUTH_ENDPOINTS.some(url => req.url.includes(url))) {
    return next(req);
  }

  const authStore = inject(AuthStore);
  const accessToken = authStore.accessToken();

  if (!accessToken) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${accessToken}` },
  }));
};
