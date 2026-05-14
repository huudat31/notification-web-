import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/auth.model';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  accessToken: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private state = signal<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    user: null,
    accessToken: null // Memory only, no localStorage
  });

  // Selectors
  readonly isAuthenticated = computed(() => !!this.state().accessToken);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly user = computed(() => this.state().user);
  readonly accessToken = computed(() => this.state().accessToken);

  // Actions
  setAuth(user: User, accessToken: string) {
    this.state.update(state => ({
      ...state,
      user,
      accessToken,
      isAuthenticated: true,
      error: null
    }));
  }

  setToken(accessToken: string) {
    this.state.update(state => ({ ...state, accessToken }));
  }

  setLoading(isLoading: boolean) {
    this.state.update(state => ({ ...state, isLoading }));
  }

  setError(error: string | null) {
    this.state.update(state => ({ ...state, error }));
  }

  reset() {
    this.state.set({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      accessToken: null
    });
  }
}
