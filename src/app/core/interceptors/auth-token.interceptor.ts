import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';

const AUTH_EXCLUDED_URLS = [
  '/refresh',
  '/logout',
  '/google-admin',
];

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (AUTH_EXCLUDED_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }

  const authService = inject(AuthService);
  const accessToken = authService.accessToken();

  if (!accessToken) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${accessToken}` },
  }));
};
