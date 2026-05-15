import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/auth.model';

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
export class AuthStore {
  private state = signal<AuthState>({
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
  readonly accessToken = computed(() => this.state().accessToken);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly isInitialized = computed(() => this.state().isInitialized);
  readonly isRestoringSession = computed(() => this.state().isRestoringSession);
  readonly isRefreshing = computed(() => this.state().isRefreshing);
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
}
