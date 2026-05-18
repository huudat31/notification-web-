import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '@data/store/auth/auth.store';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthInitService {
  private readonly authStore = inject(AuthStore);
  private readonly authSession = inject(AuthTokenService);
  private readonly authService = inject(AuthService);

  async init(): Promise<void> {
    const refreshToken = this.authSession.getRefreshToken();
    const deviceId = this.authSession.getDeviceId();

    if (!refreshToken || !deviceId) {
      this.authStore.setInitialized(true);
      return;
    }

    this.authStore.setRestoring(true);

    try {
      await firstValueFrom(this.authService.refreshSession(refreshToken));
    } catch (error) {
      this.authService.clearSession(false);
    } finally {
      this.authStore.setRestoring(false);
      this.authStore.setInitialized(true);
    }
  }
}
