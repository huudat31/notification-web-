import { HttpClient, HttpBackend } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, finalize, filter, take, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BroadcastService } from '@core/services/broadcast.service';
import { LoggerService } from '@core/services/logger.service';
import { AuthResponse, GoogleLoginRequest, TokenPayload, User } from '@data/models/auth.model';
import { Injectable, inject, signal, computed } from '@angular/core';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isRestoringSession: boolean;
  isRefreshing: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly httpWithoutInterceptors = new HttpClient(inject(HttpBackend));
  private readonly BASE_URL = `${environment.apiBaseUrl}/api/auth`;
  private readonly router = inject(Router);
  private readonly broadcast = inject(BroadcastService);
  private readonly logger = inject(LoggerService);

  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly DEVICE_ID_KEY = environment.deviceIdKey;

  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  private readonly state = signal<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isInitialized: false,
    isRestoringSession: false,
    isRefreshing: false,
    isLoading: false,
    error: null,
  });

  readonly user = computed(() => this.state().user);
  readonly currentUser = this.user;
  readonly accessToken = computed(() => this.state().accessToken);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly isInitialized = computed(() => this.state().isInitialized);
  readonly isRestoringSession = computed(() => this.state().isRestoringSession);
  readonly isRefreshingState = computed(() => this.state().isRefreshing);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  setAuth(user: User, accessToken: string): void {
    this.state.update(s => ({
      ...s,
      user,
      accessToken,
      isAuthenticated: true,
      error: null,
      isRestoringSession: false,
    }));
  }

  setAccessToken(accessToken: string): void {
    this.state.update(s => ({ ...s, accessToken, isAuthenticated: true }));
  }

  setInitialized(isInitialized: boolean): void {
    this.state.update(s => ({ ...s, isInitialized }));
  }

  setRestoring(isRestoring: boolean): void {
    this.state.update(s => ({ ...s, isRestoringSession: isRestoring }));
  }

  setRefreshing(isRefreshing: boolean): void {
    this.state.update(s => ({ ...s, isRefreshing }));
  }

  setLoading(isLoading: boolean): void {
    this.state.update(s => ({ ...s, isLoading }));
  }

  setError(error: string | null): void {
    this.state.update(s => ({ ...s, error }));
  }

  clear(): void {
    this.state.update(s => ({
      ...s,
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isRestoringSession: false,
      isRefreshing: false,
      error: null,
    }));
  }

  // --- TOKEN / DEVICE ID MANAGEMENT ---
  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  setDeviceId(deviceId: string): void {
    localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
  }

  loginGoogleAdmin(idToken: string): Observable<AuthResponse> {
    this.setLoading(true);
    this.setError(null);

    const request: GoogleLoginRequest = {
      idToken,
      fcmToken: 'WEB_TEST_TOKEN',
      deviceId: this.getDeviceId(),
      deviceType: 'WEB',
      deviceName: this.getDeviceName(),
    };

    return this.httpWithoutInterceptors.post<AuthResponse>(`${this.BASE_URL}/google-admin`, request).pipe(
      tap(response => {
        const user = this.extractUserFromResponse(response, idToken);
        this.setAuth(user, response.accessToken);
        this.setRefreshToken(response.refreshToken);
        this.logger.log('LOGIN_SUCCESS', { userId: user?.id, name: user?.name });
        void this.router.navigate(['/dashboard']);
      }),
      catchError(error => {
        const msg = error?.error?.message ?? 'Lỗi đăng nhập Google';
        this.setError(msg);
        this.logger.error('LOGIN_FAILED', { status: error?.status });
        return throwError(() => error);
      }),
      finalize(() => this.setLoading(false)),
    );
  }

  refreshSession(refreshToken: string): Observable<AuthResponse> {
    const deviceId = this.getDeviceId();
    
    return this.httpWithoutInterceptors.post<AuthResponse>(`${this.BASE_URL}/refresh`, { refreshToken, deviceId }).pipe(
      tap(response => {
        const user = this.extractUserFromResponse(response, response.accessToken);
        this.setAuth(user, response.accessToken);
        this.setRefreshToken(response.refreshToken);
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
    const deviceId = this.getDeviceId();
    this.httpWithoutInterceptors.post<void>(`${this.BASE_URL}/logout`, { deviceId }).pipe(
      finalize(() => this.clearSession(true))
    ).subscribe({
      error: () => {  }
    });
  }

  clearSession(redirect: boolean = true): void {
    this.clear();
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem('auth_user');
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

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.loginGoogleAdmin(idToken);
  }

  forceLogout(): void {
    this.clearSession(true);
  }

  refresh(): Observable<string | null> {
    if (this.isRefreshing) {
      return this.refreshSubject.pipe(
        filter(token => token !== undefined), 
        take(1)
      );
    }

    this.isRefreshing = true;
    this.refreshSubject.next(undefined as any); 

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.isRefreshing = false;
      this.refreshSubject.next(null);
      this.forceLogout();
      return new Observable<null>(subscriber => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    return this.refreshSession(refreshToken).pipe(
      switchMap(response => {
        this.isRefreshing = false;
        this.refreshSubject.next(response.accessToken);
        return new Observable<string>(subscriber => {
          subscriber.next(response.accessToken);
          subscriber.complete();
        });
      })
    );
  }

  handleRefreshFailure(): void {
    this.isRefreshing = false;
    this.refreshSubject.next(null);
    this.forceLogout();
  }
}
