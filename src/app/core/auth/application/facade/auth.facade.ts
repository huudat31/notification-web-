import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, firstValueFrom, throwError } from 'rxjs';
import { tap, catchError, finalize, timeout } from 'rxjs/operators';
import { AuthStore } from '../../domain/state/auth.store';
import { AuthApiService } from '../../infrastructure/api/auth-api.service';
import { TokenStorageService } from '../../infrastructure/storage/token.storage';
import { BroadcastService } from '../../../services/broadcast.service';
import { LoggerService } from '../../../services/logger.service';
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

  /**
   * APP_INITIALIZER — Khôi phục session sau reload.
   *
   * Flow:
   *   1. Đọc refreshToken từ sessionStorage
   *   2. Nếu không có → chưa login, setInitialized(true) và return
   *   3. Nếu có → gọi /auth/refresh với {refreshToken, deviceId}
   *   4. Nhận accessToken + refreshToken mới → lưu cả hai
   *   5. Luôn setInitialized(true) dù thành công hay thất bại
   */
  async initializeAuth(): Promise<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    // Không có refresh token → chưa login, không cần refresh
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
            // Refresh token hết hạn hoặc invalid → clear và tiếp tục
            this.tokenStorage.clearRefreshToken();
            this.logger.log('REFRESH_FAILED', { source: 'APP_INIT' });
            return of(null);
          }),
        )
      );

      if (response) {
        // Lưu accessToken vào memory + refreshToken mới vào sessionStorage (rotation)
        this.authStore.setAuth(response.user, response.accessToken);
        this.tokenStorage.saveRefreshToken(response.refreshToken);
        this.logger.log('REFRESH_SUCCESS', { source: 'APP_INIT' });
      }
    } finally {
      // Luôn set initialized dù thành công hay thất bại → tránh white screen
      this.authStore.setInitialized(true);
    }
  }

  /**
   * Google Login.
   * Sau login: lưu accessToken vào memory, refreshToken vào sessionStorage.
   */
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
