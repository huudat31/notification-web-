import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

// ─── Interceptors (thứ tự quan trọng!) ───────────────────────────────────
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { authTokenInterceptor } from './core/auth/interceptors/auth-token.interceptor';
import { refreshInterceptor } from './core/auth/interceptors/refresh.interceptor';

// ─── Initializer ──────────────────────────────────────────────────────────
import { AuthInitializerService } from './core/auth/initializer/auth.initializer';

export function initializeApp(authInitializer: AuthInitializerService) {
  return (): Promise<void> => authInitializer.init();
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
      deps: [AuthInitializerService],
      multi: true,
    },
  ],
};
