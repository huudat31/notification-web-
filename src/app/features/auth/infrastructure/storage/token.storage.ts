import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

const REFRESH_TOKEN_KEY = 'refresh_token';
const DEVICE_ID_KEY = environment.deviceIdKey;


@Injectable({ providedIn: 'root' })
export class TokenStorageService {

  saveRefreshToken(token: string): void {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearRefreshToken(): void {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  clearAll(): void {
    this.clearRefreshToken();
  }
}
