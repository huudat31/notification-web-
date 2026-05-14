import { Injectable, signal, computed } from '@angular/core';
import { User } from '../domain/models/auth.model';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
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
    isRefreshing: false,
    isLoading: false,
    error: null,
  });

  readonly user = computed(() => this.state().user);
  readonly accessToken = computed(() => this.state().accessToken);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly isInitialized = computed(() => this.state().isInitialized);
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
    }));
  }

  setToken(accessToken: string): void {
    this.state.update(s => ({ ...s, accessToken, isAuthenticated: true }));
  }

  setInitialized(isInitialized: boolean): void {
    this.state.update(s => ({ ...s, isInitialized }));
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

  reset(): void {
    this.state.update(s => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitialized: true,
      isRefreshing: false,
      isLoading: false,
      error: null,
    }));
  }
}
