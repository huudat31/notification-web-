import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../store/auth.store';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthInitializerService {
  private readonly authStore = inject(AuthStore);
  private readonly authSession = inject(AuthSessionService);
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
      // Wait for the refresh session to complete
      await firstValueFrom(this.authService.refreshSession(refreshToken));
    } catch (error) {
      // If refresh fails on boot, we clear everything silently
      this.authService.clearSession(false);
    } finally {
      this.authStore.setRestoring(false);
      this.authStore.setInitialized(true);
    }
  }
}
