/**
 * Phiên đăng nhập của học sinh (chỉ khi ACCOUNT_ENABLED):
 *   status  guest      — khách (máy lớp dùng chung: không gửi điểm)
 *           restoring  — mở app thấy refresh token đã lưu, đang lấy access token mới
 *           signedIn   — có user; access token (bộ nhớ) do apiClient giữ, mirror ở đây để UI đọc
 * Lưu localStorage `phonics-arcade:auth` = { user, refreshToken }. Mất mạng lúc mở app thì vẫn coi
 * như đang đăng nhập với user đã lưu (điểm xếp hàng chờ), có mạng lại là refresh tự chạy.
 */
import {
  User,
  type AuthResponse,
  type GoogleProfile,
  type LoginBody,
  type RegisterBody,
} from '@phonics/contracts';
import * as api from '@/platform/account/accountApi';
import {
  clearTokens,
  isApiError,
  refreshAccessToken,
  setTokens,
  takeRefreshedAuth,
  tokenStore,
} from '@/platform/account/apiClient';
import { ACCOUNT_ENABLED } from '@/platform/account/config';
import { useStore } from '@/platform/hooks/useStore';
import { readJson, removeKeys, writeJson } from '@/platform/storage';
import { createStore } from '@/shared/createStore';

export type AuthStatus = 'guest' | 'restoring' | 'signedIn';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  /** Google: tài khoản mới, server cần tên + lớp (422 PROFILE_REQUIRED) -> màn đăng ký "chế độ Google" */
  pendingGoogleIdToken: string | null;
}

export const AUTH_KEY = 'phonics-arcade:auth';

interface AuthSnapshot {
  user: User;
  refreshToken: string;
}

function loadSnapshot(): AuthSnapshot | null {
  const stored = readJson<AuthSnapshot>(AUTH_KEY);
  if (!stored || typeof stored.refreshToken !== 'string' || !stored.refreshToken) return null;
  const user = User.safeParse(stored.user);
  return user.success ? { user: user.data, refreshToken: stored.refreshToken } : null;
}

const snapshot = ACCOUNT_ENABLED ? loadSnapshot() : null;
if (snapshot) setTokens({ accessToken: null, refreshToken: snapshot.refreshToken });

export const authStore = createStore<AuthState>({
  status: snapshot ? 'restoring' : 'guest',
  user: snapshot?.user ?? null,
  accessToken: null,
  pendingGoogleIdToken: null,
});

function persist(): void {
  const { user } = authStore.get();
  const { refreshToken } = tokenStore.get();
  if (user && refreshToken) writeJson(AUTH_KEY, { user, refreshToken } satisfies AuthSnapshot);
  else removeKeys([AUTH_KEY]);
}

// Token đổi (đăng nhập, refresh xoay vòng, bị thu hồi) -> lưu lại / về khách
tokenStore.subscribe(() => {
  const { accessToken, refreshToken } = tokenStore.get();
  if (!refreshToken) {
    if (authStore.get().status !== 'guest') authActions.signOutLocal();
    return;
  }
  authStore.set((state) => (state.accessToken === accessToken ? state : { ...state, accessToken }));
  persist();
});

function applyAuth(response: AuthResponse): void {
  setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken ?? null });
  authStore.set((state) => ({
    ...state,
    status: 'signedIn',
    user: response.user,
    accessToken: response.accessToken,
    pendingGoogleIdToken: null,
  }));
  persist();
}

export const authActions = {
  /** Mở app: có refresh token thì lấy access token mới + user mới nhất */
  async restore(): Promise<void> {
    if (authStore.get().status !== 'restoring') return;
    try {
      const ok = await refreshAccessToken();
      if (!ok) return; // tokenStore đã bị xoá -> signOutLocal chạy qua subscribe
      const refreshed = takeRefreshedAuth();
      authStore.set((state) => ({
        ...state,
        status: 'signedIn',
        user: refreshed?.user ?? state.user,
        accessToken: tokenStore.get().accessToken,
      }));
      persist();
    } catch {
      // Mất mạng / server lỗi: giữ user đã lưu, điểm xếp hàng; request sau sẽ refresh lại
      authStore.set((state) =>
        state.user ? { ...state, status: 'signedIn' } : { ...state, status: 'guest' },
      );
    }
  },

  async login(body: LoginBody): Promise<void> {
    applyAuth(await api.login(body));
  },

  async register(body: RegisterBody): Promise<void> {
    applyAuth(await api.register(body));
  },

  /**
   * Đăng nhập Google. Tài khoản mới chưa có tên / lớp: trả 'profile-required' và giữ idToken
   * để màn đăng ký gửi kèm profile.
   */
  async google(idToken: string, profile?: GoogleProfile): Promise<'ok' | 'profile-required'> {
    try {
      applyAuth(await api.googleSignIn(profile ? { idToken, profile } : { idToken }));
      return 'ok';
    } catch (error) {
      if (isApiError(error) && error.code === 'PROFILE_REQUIRED') {
        authStore.set((state) => ({ ...state, pendingGoogleIdToken: idToken }));
        return 'profile-required';
      }
      throw error;
    }
  },

  clearPendingGoogle(): void {
    authStore.set((state) => (state.pendingGoogleIdToken ? { ...state, pendingGoogleIdToken: null } : state));
  },

  /** Đăng xuất: báo server thu hồi refresh token (không bắt buộc thành công) rồi xoá local */
  async signOut(): Promise<void> {
    const { refreshToken } = tokenStore.get();
    authActions.signOutLocal();
    if (refreshToken) await api.logout(refreshToken).catch(() => {});
  },

  /** Xoá phiên trên máy này (token hết hạn / bị thu hồi / đăng xuất) */
  signOutLocal(): void {
    // Về khách TRƯỚC rồi mới xoá token: listener của tokenStore thấy đã là khách thì không gọi lại hàm này
    authStore.set({ status: 'guest', user: null, accessToken: null, pendingGoogleIdToken: null });
    clearTokens();
    removeKeys([AUTH_KEY]);
  },

  /** Sau khi sửa hồ sơ */
  setUser(user: User): void {
    authStore.set((state) => ({ ...state, user }));
    persist();
  },
};

export const useAuth = (): AuthState => useStore(authStore, (state) => state);

export const isSignedIn = (state: AuthState = authStore.get()): boolean =>
  state.status === 'signedIn' && state.user !== null;

/** Tên gọi ngắn (từ đầu tiên của displayName) cho nút ở màn chọn game */
export const firstName = (user: User): string => user.displayName.trim().split(/\s+/)[0] ?? '';
