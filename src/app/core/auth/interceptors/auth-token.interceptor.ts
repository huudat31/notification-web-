import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthFacade } from '../facade/auth.facade';

const AUTH_EXCLUDED_URLS = [
  '/refresh',
  '/logout',
  '/google-admin',
];

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (AUTH_EXCLUDED_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }

  const authFacade = inject(AuthFacade);
  const accessToken = authFacade.accessToken();

  if (!accessToken) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${accessToken}` },
  }));
};
