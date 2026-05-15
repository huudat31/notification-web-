import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, BehaviorSubject, filter, take, switchMap } from 'rxjs';
import { AuthStore } from '../store/auth.store';
import { AuthService } from '../services/auth.service';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  // Refresh Lock
  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  // Expose state from store
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

  /**
   * Refreshes the token and queues concurrent requests to avoid race conditions.
   * Resolves to the new access token if successful, or null if failed.
   */
  refresh(): Observable<string | null> {
    if (this.isRefreshing) {
      // Queue requests until refresh completes
      return this.refreshSubject.pipe(
        filter(token => token !== undefined), // wait until it's null (fail) or string (success)
        take(1)
      );
    }

    this.isRefreshing = true;
    this.refreshSubject.next(undefined as any); // Set to pending state

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

  /**
   * Called internally when a refresh fails completely
   */
  handleRefreshFailure(): void {
    this.isRefreshing = false;
    this.refreshSubject.next(null);
    this.forceLogout();
  }
}
