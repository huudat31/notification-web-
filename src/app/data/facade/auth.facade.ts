import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { filter, take, switchMap } from 'rxjs/operators';
import { AuthStore } from '@data/store/auth/auth.store';
import { AuthService } from '@core/auth/auth.service';
import { AuthTokenService } from '@core/auth/auth-token.service';
import { AuthResponse } from '@data/model/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly authSession = inject(AuthTokenService);
  private readonly router = inject(Router);

  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly isInitialized = this.authStore.isInitialized;
  readonly isLoading = this.authStore.isLoading;
  readonly currentUser = this.authStore.user;
  readonly error = this.authStore.error;
  readonly accessToken = this.authStore.accessToken;

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.authService.loginGoogleAdmin(idToken);
  }

  logout(): void {
    this.authService.logout();
  }

  forceLogout(): void {
    this.authService.clearSession(true);
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

    const refreshToken = this.authSession.getRefreshToken();
    if (!refreshToken) {
      this.isRefreshing = false;
      this.refreshSubject.next(null);
      this.forceLogout();
      return new Observable<null>(subscriber => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    return this.authService.refreshSession(refreshToken).pipe(
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
