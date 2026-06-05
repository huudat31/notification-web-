import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthInitService {
  private readonly authSession = inject(AuthService);
  private readonly authService = inject(AuthService);

  async init(): Promise<void> {
    const refreshToken = this.authSession.getRefreshToken();
    const deviceId = this.authSession.getDeviceId();

    if (!refreshToken || !deviceId) {
      this.authService.setInitialized(true);
      return;
    }

    this.authService.setRestoring(true);

    try {
      await firstValueFrom(this.authService.refreshSession(refreshToken));
    } catch (error) {
      this.authService.clearSession(false);
    } finally {
      this.authService.setRestoring(false);
      this.authService.setInitialized(true);
    }
  }
}
