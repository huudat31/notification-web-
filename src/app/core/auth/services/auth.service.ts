import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of, firstValueFrom } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../store/auth.store';
import { TokenStorageService } from '../../storage/token.storage';
import { GoogleLoginRequest, AuthResponse, RefreshTokenRequest, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private tokenStorage = inject(TokenStorageService);
  private handler = inject(HttpBackend);

  // Dùng HttpClient riêng để bypass interceptor khi login/refresh/logout
  private http = new HttpClient(this.handler);

  private readonly API_URL = environment.apiBaseUrl + '/api/auth';

  constructor() { }

  /**
   * Khởi tạo Auth (Dùng cho APP_INITIALIZER)
   */
  initializeAuth(): Promise<void> {
    return firstValueFrom(
      this.refreshToken().pipe(
        tap((response) => {
          // Refresh token method already sets auth in store, but we can ensure it here
        }),
        catchError(() => {
          this.authStore.reset(); // Sử dụng reset
          return of(null);
        })
      )
    ).then(() => { });
  }

  /**
   * Đăng nhập Google Admin
   */
  loginGoogleAdmin(idToken: string): Observable<AuthResponse> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);

    const request: GoogleLoginRequest = {
      idToken,
      fcmToken: 'WEB_TEST_TOKEN', // Thêm lại token test theo yêu cầu trước đó
      deviceId: this.tokenStorage.getDeviceId(),
      deviceType: 'WEB',
      deviceName: this.getDeviceName()
    };

    return this.http.post<AuthResponse>(`${this.API_URL}/google-admin`, request, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.authStore.setAuth(response.user, response.accessToken);
        this.authStore.setLoading(false);
        this.router.navigate(['/dashboard']);
      }),
      catchError(error => {
        this.authStore.setLoading(false);
        const msg = error?.error?.message || 'Lỗi đăng nhập Google';
        this.authStore.setError(msg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh Token
   */
  refreshToken(): Observable<string> {
    const request: RefreshTokenRequest = {
      deviceId: this.tokenStorage.getDeviceId()
    };

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, request, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.authStore.setToken(response.accessToken);
        if (response.user) {
          this.authStore.setAuth(response.user, response.accessToken);
        }
      }),
      map(response => response.accessToken),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Đăng xuất
   */
  logout(): void {
    const deviceId = this.tokenStorage.getDeviceId();
    this.http.post(`${this.API_URL}/logout`, { deviceId }, { withCredentials: true })
      .pipe(
        finalize(() => {
          this.authStore.reset();
          this.router.navigate(['/login']);
        })
      ).subscribe();
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    return 'Web Browser';
  }
}
