import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

const REFRESH_TOKEN_KEY = 'refresh_token';
const DEVICE_ID_KEY = environment.deviceIdKey;

@Injectable({ providedIn: 'root' })
export class AuthTokenService {

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  setDeviceId(deviceId: string): void {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  clear(): void {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('auth_user'); 
  }
}
