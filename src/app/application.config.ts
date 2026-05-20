import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { routes } from './application.routes';

import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { authTokenInterceptor } from '@core/interceptors/auth-token.interceptor';
import { refreshInterceptor } from '@core/interceptors/refresh.interceptor';
import { serviceInterceptor } from '@core/interceptors/service.interceptor';

import { AuthInitService } from '@core/auth/auth-init.service';
import { initializeRealtime } from '@core/realtime/initializer/realtime.initializer';
import { RealtimeSyncService } from '@core/realtime/services/realtime-sync.service';
import { CustomRouteReuseStrategy } from './common/routing/custom-route-reuse';

export function initializeApp(authInit: AuthInitService) {
  return (): Promise<void> => authInit.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        errorInterceptor,
        authTokenInterceptor,
        refreshInterceptor,
        serviceInterceptor
      ])
    ),
    provideAnimations(),
    provideAngularQuery(new QueryClient()),
    {
      provide: RouteReuseStrategy,
      useClass: CustomRouteReuseStrategy
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthInitService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRealtime,
      deps: [RealtimeSyncService],
      multi: true,
    },
  ],
};
