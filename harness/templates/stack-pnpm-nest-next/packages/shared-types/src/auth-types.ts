import type { UserDto } from './user-types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: UserDto;
}

/** Payload embedded in both access and refresh JWTs. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}
