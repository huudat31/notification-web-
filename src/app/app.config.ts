import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

// ─── Interceptors (thứ tự quan trọng!) ───────────────────────────────────
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';

// ─── Facade ───────────────────────────────────────────────────────────────
import { AuthFacade } from './features/auth/application/facade/auth.facade';

export function initializeApp(authFacade: AuthFacade) {
  return (): Promise<void> => authFacade.initializeAuth();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        errorInterceptor,
        authTokenInterceptor,
        refreshInterceptor,
      ])
    ),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthFacade],
      multi: true,
    },
  ],
};
