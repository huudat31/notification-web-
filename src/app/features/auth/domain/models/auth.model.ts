export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
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
  refreshToken: string;
  deviceId: string;
}

export interface LogoutRequest {
  deviceId: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export type AuthEventType =
  | 'LOGIN_SUCCESS'
  | 'REFRESH_SUCCESS'
  | 'REFRESH_FAILED'
  | 'AUTO_LOGOUT'
  | 'TOKEN_EXPIRED'
  | 'MULTI_TAB_LOGOUT';

export interface AuthEvent {
  type: AuthEventType;
  timestamp: number;
  details?: Record<string, unknown>;
}
