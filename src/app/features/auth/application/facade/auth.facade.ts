import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, firstValueFrom, throwError } from 'rxjs';
import { tap, catchError, finalize, timeout } from 'rxjs/operators';
import { AuthStore } from '../../state/auth.store';
import { AuthApiService } from '../../infrastructure/api/auth-api.service';
import { TokenStorageService } from '../../infrastructure/storage/token.storage';
import { BroadcastService } from '../../../../core/services/broadcast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { AuthResponse, GoogleLoginRequest } from '../../domain/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authStore = inject(AuthStore);
  private readonly authApi = inject(AuthApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly broadcast = inject(BroadcastService);
  private readonly logger = inject(LoggerService);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly isInitialized = this.authStore.isInitialized;
  readonly isLoading = this.authStore.isLoading;
  readonly isRefreshing = this.authStore.isRefreshing;
  readonly currentUser = this.authStore.user;
  readonly error = this.authStore.error;

  async initializeAuth(): Promise<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      this.authStore.setInitialized(true);
      return;
    }

    try {
      const deviceId = this.tokenStorage.getDeviceId();
      const response = await firstValueFrom(
        this.authApi.refreshToken({ refreshToken, deviceId }).pipe(
          timeout(10_000),
          catchError((err) => {
            this.tokenStorage.clearRefreshToken();
            this.logger.log('REFRESH_FAILED', { source: 'APP_INIT' });
            return of(null);
          }),
        )
      );

      if (response) {
        this.authStore.setAuth(response.user, response.accessToken);
        this.tokenStorage.saveRefreshToken(response.refreshToken);
        this.logger.log('REFRESH_SUCCESS', { source: 'APP_INIT' });
      }
    } finally {
      this.authStore.setInitialized(true);
    }
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);

    const request: GoogleLoginRequest = {
      idToken,
      fcmToken: 'WEB_TEST_TOKEN',
      deviceId: this.tokenStorage.getDeviceId(),
      deviceType: 'WEB',
      deviceName: this.getDeviceName(),
    };

    return this.authApi.loginGoogleAdmin(request).pipe(
      tap(response => {
        this.authStore.setAuth(response.user, response.accessToken);
        this.tokenStorage.saveRefreshToken(response.refreshToken);
        this.logger.log('LOGIN_SUCCESS', { userId: response.user?.id });
        void this.router.navigate(['/dashboard']);
      }),
      catchError((error: any) => {
        const msg = (error?.error?.message as string) ?? 'Lỗi đăng nhập Google';
        this.authStore.setError(msg);
        this.logger.error('LOGIN_FAILED', { status: error?.status as number });
        return throwError(() => error);
      }),
      finalize(() => this.authStore.setLoading(false)),
    );
  }

  logout(): void {
    const deviceId = this.tokenStorage.getDeviceId();
    this.authApi.logout(deviceId).pipe(
      finalize(() => this._performLocalLogout()),
    ).subscribe();
  }

  forceLogout(): void {
    this._performLocalLogout();
  }

  private _performLocalLogout(): void {
    this.authStore.reset();
    this.tokenStorage.clearAll();
    this.broadcast.broadcastLogout();
    void this.router.navigate(['/login']);
    this.logger.log('AUTO_LOGOUT', {});
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    return 'Web Browser';
  }
}
