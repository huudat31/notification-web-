import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GoogleLoginRequest, AuthResponse, RefreshTokenRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http: HttpClient;
  private readonly BASE_URL = `${environment.apiBaseUrl}/api/auth`;

  constructor() {
    // Use HttpBackend to bypass interceptors if needed, 
    // or we can use normal HttpClient if we want interceptors.
    // The user's architecture requested pure calls. 
    // We will bypass all interceptors to avoid loops for auth APIs.
    const handler = inject(HttpBackend);
    this.http = new HttpClient(handler);
  }

  loginGoogleAdmin(request: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.BASE_URL}/google-admin`,
      request
    );
  }

  refreshToken(request: RefreshTokenRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.BASE_URL}/refresh`,
      request
    );
  }

  logout(deviceId: string): Observable<void> {
    return this.http.post<void>(
      `${this.BASE_URL}/logout`,
      { deviceId }
    );
  }
}
