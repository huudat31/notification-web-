export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface GoogleLoginRequest {
  idToken: string;
  fcmToken?: string;
  deviceId: string;
  deviceType: string;
  deviceName: string;
}

export interface RefreshTokenRequest {
  deviceId: string;
}

export interface LogoutRequest {
  deviceId: string;
}
