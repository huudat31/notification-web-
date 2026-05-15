import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { AuthApi } from '../data-access/auth.api';
import { AuthStore } from '../store/auth.store';
import { AuthSessionService } from './auth-session.service';
import { BroadcastService } from '../../services/broadcast.service';
import { LoggerService } from '../../services/logger.service';
import { AuthResponse, GoogleLoginRequest, TokenPayload, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly broadcast = inject(BroadcastService);
  private readonly logger = inject(LoggerService);

  loginGoogleAdmin(idToken: string): Observable<AuthResponse> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);

    const request: GoogleLoginRequest = {
      idToken,
      fcmToken: 'WEB_TEST_TOKEN',
      deviceId: this.authSession.getDeviceId(),
      deviceType: 'WEB',
      deviceName: this.getDeviceName(),
    };

    return this.authApi.loginGoogleAdmin(request).pipe(
      tap(response => {
        const user = this.extractUserFromResponse(response, idToken);
        this.authStore.setAuth(user, response.accessToken);
        this.authSession.setRefreshToken(response.refreshToken);
        this.logger.log('LOGIN_SUCCESS', { userId: user?.id, name: user?.name });
        void this.router.navigate(['/dashboard']);
      }),
      catchError(error => {
        const msg = error?.error?.message ?? 'Lỗi đăng nhập Google';
        this.authStore.setError(msg);
        this.logger.error('LOGIN_FAILED', { status: error?.status });
        return throwError(() => error);
      }),
      finalize(() => this.authStore.setLoading(false)),
    );
  }

  refreshSession(refreshToken: string): Observable<AuthResponse> {
    const deviceId = this.authSession.getDeviceId();
    
    return this.authApi.refreshToken({ refreshToken, deviceId }).pipe(
      tap(response => {
        const user = this.extractUserFromResponse(response, response.accessToken);
        this.authStore.setAuth(user, response.accessToken);
        this.authSession.setRefreshToken(response.refreshToken);
        this.logger.log('REFRESH_SUCCESS', { source: 'AUTH_SERVICE' });
      }),
      catchError(error => {
        this.logger.log('REFRESH_FAILED', { source: 'AUTH_SERVICE' });
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    const deviceId = this.authSession.getDeviceId();
    this.authApi.logout(deviceId).pipe(
      finalize(() => this.clearSession(true))
    ).subscribe({
      error: () => { /* ignore error on logout */ }
    });
  }

  clearSession(redirect: boolean = true): void {
    this.authStore.clear();
    this.authSession.clear();
    this.broadcast.broadcastLogout();
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    return 'Web Browser';
  }

  private extractUserFromResponse(response: AuthResponse, fallbackToken: string): User {
    if (response.user) {
      return response.user;
    }
    const payload = this.parseJwt(response.accessToken || fallbackToken);
    if (payload) {
      return {
        id: payload.sub,
        email: payload.email,
        name: (payload as any).name || payload.email?.split('@')[0] || 'Admin User',
        role: payload.role || 'ADMIN',
        avatar: (payload as any).picture || ''
      };
    }
    return { id: '', email: '', name: 'Unknown', role: 'ADMIN' };
  }

  private parseJwt(token: string): TokenPayload | null {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e: any) {
      return null;
    }
  }
}
