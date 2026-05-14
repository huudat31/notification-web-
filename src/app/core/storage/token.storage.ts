import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  constructor() { }

  getDeviceId(): string {
    let deviceId = localStorage.getItem(environment.deviceIdKey);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(environment.deviceIdKey, deviceId);
    }
    return deviceId;
  }

  clear(): void {
    // Không còn lưu token ở local storage nữa, chỉ giữ deviceId
  }
}
