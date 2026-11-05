/**
 * Repository tài khoản gia đình: chỉ khai báo endpoint (đường dẫn `ENDPOINTS`, method, body, schema contracts) và trả
 * DTO đúng như BE. Không map / format ở đây — việc đó của `authService`.
 */
import {
  AuthResponse,
  ENDPOINTS,
  FamilyProfilesResponse,
  MeResponse,
  type GoogleBody,
  type LoginBody,
  type LogoutBody,
  type SetPasswordBody,
  type SwitchProfileBody,
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
  googleSignIn: (body: GoogleBody) =>
    request(ENDPOINTS.auth.google, {
      method: HttpMethod.POST,
      body,
      schema: AuthResponse,
      auth: AuthMode.NONE,
    }),
  /** Đặt mật khẩu lần đầu từ link mời → phiên phụ huynh */
  setPassword: (body: SetPasswordBody) =>
    request(ENDPOINTS.auth.setPassword, {
      method: HttpMethod.POST,
      body,
      schema: AuthResponse,
      auth: AuthMode.NONE,
    }),
  /** Hồ sơ các bé (phiên phụ huynh) */
  profiles: () => request(ENDPOINTS.auth.profiles, { schema: FamilyProfilesResponse }),
  /** Mở phiên của bé (phiên phụ huynh) → AuthResponse của bé, refresh token luôn trong body */
  switchProfile: (body: SwitchProfileBody) =>
    request(ENDPOINTS.auth.switchProfile, { method: HttpMethod.POST, body, schema: AuthResponse }),
  logout: (body: LogoutBody) =>
    request(ENDPOINTS.auth.logout, { method: HttpMethod.POST, body, auth: AuthMode.OPTIONAL }),
  me: () => request(ENDPOINTS.auth.me, { schema: MeResponse }),
};
