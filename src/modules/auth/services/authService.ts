/**
 * Service tài khoản gia đình: gọi `authRepository` rồi đổi DTO → model (`UserModel`, `FamilyProfileModel`).
 * Store / màn hình chỉ gọi service, không gọi repository trực tiếp.
 */
import type {
  AuthResponse,
  GoogleBody,
  LoginBody,
  MeResponse,
  SetPasswordBody,
  SwitchProfileBody,
} from '@phonics/contracts';
import { authRepository } from '@/modules/auth/repositories/authRepository';
import { FamilyProfileModel } from '@/modules/auth/models/FamilyProfileModel';
import { UserModel } from '@/modules/auth/models/UserModel';
import { refreshAccessToken, takeRefreshedAuth } from '@/core/api/client';

/** Phiên vừa đăng nhập: token như BE, `user` là model */
export type AuthSession = Omit<AuthResponse, 'user'> & { user: UserModel };

export type Me = Omit<MeResponse, 'user'> & { user: UserModel };

const toUser = (data: AuthResponse['user']) => new UserModel(data);
const toSession = (data: AuthResponse): AuthSession => ({ ...data, user: toUser(data.user) });

export const authService = {
  login: async (body: LoginBody) => toSession(await authRepository.login(body)),
  googleSignIn: async (body: GoogleBody) => toSession(await authRepository.googleSignIn(body)),
  setPassword: async (body: SetPasswordBody) => toSession(await authRepository.setPassword(body)),
  profiles: async (): Promise<FamilyProfileModel[]> =>
    (await authRepository.profiles()).items.map((item) => new FamilyProfileModel(item)),
  switchProfile: async (body: SwitchProfileBody) => toSession(await authRepository.switchProfile(body)),
  /** Thu hồi refresh token trên server (ack, không có body trả về) */
  logout: (refreshToken: string) => authRepository.logout({ refreshToken }),
  me: async (): Promise<Me> => {
    const data = await authRepository.me();
    return { ...data, user: toUser(data.user) };
  },
  /**
   * Lấy access token mới bằng refresh token đã lưu (client gộp single flight, xoay token).
   * null = không còn phiên (token đã bị xoá); `user` null khi không có response refresh mới để lấy user.
   * Mất mạng / lỗi server -> ném ApiError.
   */
  refreshSession: async (): Promise<{ user: UserModel | null } | null> => {
    if (!(await refreshAccessToken())) return null;
    const refreshed = takeRefreshedAuth();
    return { user: refreshed ? toUser(refreshed.user) : null };
  },
};
