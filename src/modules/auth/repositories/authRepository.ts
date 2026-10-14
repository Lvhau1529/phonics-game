/**
 * Repository đăng nhập / hồ sơ: chỉ khai báo endpoint (đường dẫn `ENDPOINTS`, method, body, schema contracts) và trả
 * DTO đúng như BE. Không map / format ở đây — việc đó của `authService`.
 */
import {
  AuthResponse,
  ENDPOINTS,
  MeResponse,
  User,
  type GoogleBody,
  type LoginBody,
  type LogoutBody,
  type RegisterBody,
  type UpdateProfileBody,
} from '@phonics/contracts';
import { AuthMode, HttpMethod, request } from '@/core/api/client';

export const authRepository = {
  login: (body: LoginBody) =>
    request(ENDPOINTS.auth.login, {
      method: HttpMethod.POST,
      body,
      schema: AuthResponse,
      auth: AuthMode.NONE,
    }),
  register: (body: RegisterBody) =>
    request(ENDPOINTS.auth.register, {
      method: HttpMethod.POST,
      body,
      schema: AuthResponse,
      auth: AuthMode.NONE,
    }),
  googleSignIn: (body: GoogleBody) =>
    request(ENDPOINTS.auth.google, {
      method: HttpMethod.POST,
      body,
      schema: AuthResponse,
      auth: AuthMode.NONE,
    }),
  logout: (body: LogoutBody) =>
    request(ENDPOINTS.auth.logout, { method: HttpMethod.POST, body, auth: AuthMode.OPTIONAL }),
  me: () => request(ENDPOINTS.auth.me, { schema: MeResponse }),
  updateProfile: (body: UpdateProfileBody) =>
    request(ENDPOINTS.me.profile, { method: HttpMethod.PATCH, body, schema: User }),
};
