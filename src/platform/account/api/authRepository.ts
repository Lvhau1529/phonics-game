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
import { request } from '@/platform/api/client';

export const authRepository = {
  login: (body: LoginBody) =>
    request(ENDPOINTS.auth.login, { method: 'POST', body, schema: AuthResponse, auth: 'none' }),
  register: (body: RegisterBody) =>
    request(ENDPOINTS.auth.register, { method: 'POST', body, schema: AuthResponse, auth: 'none' }),
  googleSignIn: (body: GoogleBody) =>
    request(ENDPOINTS.auth.google, { method: 'POST', body, schema: AuthResponse, auth: 'none' }),
  logout: (body: LogoutBody) => request(ENDPOINTS.auth.logout, { method: 'POST', body, auth: 'optional' }),
  me: () => request(ENDPOINTS.auth.me, { schema: MeResponse }),
  updateProfile: (body: UpdateProfileBody) =>
    request(ENDPOINTS.me.profile, { method: 'PATCH', body, schema: User }),
};
