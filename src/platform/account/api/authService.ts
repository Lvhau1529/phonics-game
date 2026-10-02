/**
 * Service đăng nhập / hồ sơ: gọi `authRepository` rồi đổi DTO → model (`UserModel`).
 * Store / màn hình chỉ gọi service, không gọi repository trực tiếp.
 */
import type {
  AuthResponse,
  GoogleBody,
  LoginBody,
  MeResponse,
  RegisterBody,
  UpdateProfileBody,
} from '@phonics/contracts';
import { authRepository } from '@/platform/account/api/authRepository';
import { UserModel } from '@/platform/account/models/UserModel';
import { refreshAccessToken, takeRefreshedAuth } from '@/platform/api/client';

/** Phiên vừa đăng nhập: token như BE, `user` là model */
export type AuthSession = Omit<AuthResponse, 'user'> & { user: UserModel };

export type Me = Omit<MeResponse, 'user'> & { user: UserModel };

const toUser = (data: AuthResponse['user']) => new UserModel(data);
const toSession = (data: AuthResponse): AuthSession => ({ ...data, user: toUser(data.user) });

export const authService = {
  login: async (body: LoginBody) => toSession(await authRepository.login(body)),
  register: async (body: RegisterBody) => toSession(await authRepository.register(body)),
  googleSignIn: async (body: GoogleBody) => toSession(await authRepository.googleSignIn(body)),
  /** Thu hồi refresh token trên server (ack, không có body trả về) */
  logout: (refreshToken: string) => authRepository.logout({ refreshToken }),
  me: async (): Promise<Me> => {
    const data = await authRepository.me();
    return { ...data, user: toUser(data.user) };
  },
  updateProfile: async (body: UpdateProfileBody) => toUser(await authRepository.updateProfile(body)),
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
