/**
 * Phiên tài khoản gia đình (chỉ khi ACCOUNT_ENABLED). Bé ~5 tuổi không có tài khoản riêng: phụ huynh đăng nhập
 * (email / mật khẩu, Google, hoặc link mời đặt mật khẩu) → chọn hồ sơ bé (`auth/switch-profile`) → bé chơi, điểm /
 * bài tập ghi cho hồ sơ bé.
 *
 *   status  guest      — khách (máy lớp dùng chung / chưa đăng nhập: không gửi điểm)
 *           restoring  — mở app thấy refresh token đã lưu, đang lấy access token mới
 *           signedIn   — có phiên: `user` là phụ huynh (đang ở màn chọn bé) hoặc bé đang chơi
 *
 * Mỗi lúc `tokenStore` (core/api/client) chỉ giữ MỘT phiên — phiên đang dùng:
 *   - phụ huynh: gọi `auth/profiles`, `auth/switch-profile`
 *   - bé: mọi `/me/*` (điểm, bài tập, mở khoá game). Phiên phụ huynh khi đó "đỗ" lại: refresh token phụ huynh giữ
 *     trong `parentRefreshToken` (localStorage), `parent` là user phụ huynh. Đổi bé / về màn chọn bé = thu hồi phiên
 *     bé rồi lấy lại phiên phụ huynh (`backToParent`).
 * Phiên bé bị từ chối (phụ huynh mất quyền vào hồ sơ, bé bị khoá…) → tự về phiên phụ huynh thay vì đăng xuất hẳn.
 *
 * Lưu localStorage `phonics-arcade:auth` = { user, refreshToken, parent?: { user, refreshToken } }.
 * Mất mạng lúc mở app thì vẫn coi như đang đăng nhập với user đã lưu (điểm xếp hàng chờ), có mạng lại là refresh tự chạy.
 */
import { User, type LoginBody, type SetPasswordBody } from '@phonics/contracts';
import { authService, type AuthSession } from '@/modules/auth/services/authService';
import type { FamilyProfileModel } from '@/modules/auth/models/FamilyProfileModel';
import { ACCOUNT_ENABLED } from '@/core/config/account';
import { clearRequestCache } from '@/core/hooks/useRequest';
import { UserModel } from '@/modules/auth/models/UserModel';
import { ApiError, ClientErrorCode, clearTokens, setTokens, tokenStore } from '@/core/api/client';
import { useStore } from '@/core/store/useStore';
import { readJson, removeKeys, writeJson } from '@/core/storage/storage';
import { createStore } from '@/core/store/createStore';

export type AuthStatus = 'guest' | 'restoring' | 'signedIn';

export interface AuthState {
  status: AuthStatus;
  /** Người đang dùng phiên: phụ huynh hoặc bé đang chơi */
  user: UserModel | null;
  accessToken: string | null;
  /** Phụ huynh của phiên bé đang chơi (null khi `user` chính là phụ huynh, hoặc là khách) */
  parent: UserModel | null;
  /** Refresh token phiên phụ huynh đang "đỗ" khi bé chơi */
  parentRefreshToken: string | null;
}

export const AUTH_KEY = 'phonics-arcade:auth';

/** Bản lưu localStorage: user là DTO (`UserModel.toJSON()`) */
interface AuthSnapshot {
  user: User;
  refreshToken: string;
  parent?: { user: User; refreshToken: string };
}

interface LoadedSnapshot {
  user: UserModel;
  refreshToken: string;
  parent: { user: UserModel; refreshToken: string } | null;
}

function loadSnapshot(): LoadedSnapshot | null {
  const stored = readJson<AuthSnapshot>(AUTH_KEY);
  if (!stored || typeof stored.refreshToken !== 'string' || !stored.refreshToken) return null;
  const user = User.safeParse(stored.user);
  if (!user.success) return null;
  const parentUser = stored.parent ? User.safeParse(stored.parent.user) : null;
  const parent =
    parentUser?.success && typeof stored.parent?.refreshToken === 'string' && stored.parent.refreshToken
      ? { user: new UserModel(parentUser.data), refreshToken: stored.parent.refreshToken }
      : null;
  return { user: new UserModel(user.data), refreshToken: stored.refreshToken, parent };
}

const snapshot = ACCOUNT_ENABLED ? loadSnapshot() : null;
if (snapshot) setTokens({ accessToken: null, refreshToken: snapshot.refreshToken });

export const authStore = createStore<AuthState>({
  status: snapshot ? 'restoring' : 'guest',
  user: snapshot?.user ?? null,
  accessToken: null,
  parent: snapshot?.parent?.user ?? null,
  parentRefreshToken: snapshot?.parent?.refreshToken ?? null,
});

function persist(): void {
  const { user, parent, parentRefreshToken } = authStore.get();
  const { refreshToken } = tokenStore.get();
  if (!user || !refreshToken) {
    removeKeys([AUTH_KEY]);
    return;
  }
  const value: AuthSnapshot = { user: user.toJSON(), refreshToken };
  if (parent && parentRefreshToken)
    value.parent = { user: parent.toJSON(), refreshToken: parentRefreshToken };
  writeJson(AUTH_KEY, value);
}

/** Lấy lại phiên phụ huynh đang đỗ (access token lấy bằng refresh ở lời gọi kế tiếp) */
function resumeParent(): boolean {
  const { parent, parentRefreshToken } = authStore.get();
  if (!parent || !parentRefreshToken) return false;
  // Đổi state TRƯỚC rồi mới đặt token: listener của tokenStore thấy đã là phiên phụ huynh
  authStore.set((state) => ({
    ...state,
    status: 'signedIn',
    user: parent,
    accessToken: null,
    parent: null,
    parentRefreshToken: null,
  }));
  setTokens({ accessToken: null, refreshToken: parentRefreshToken });
  clearRequestCache();
  persist();
  return true;
}

// Token đổi (đăng nhập, refresh xoay vòng, bị thu hồi) -> lưu lại / về phiên phụ huynh / về khách
tokenStore.subscribe(() => {
  const { accessToken, refreshToken } = tokenStore.get();
  if (!refreshToken) {
    // Phiên bé bị từ chối → về phiên phụ huynh; phiên phụ huynh bị từ chối → khách
    if (resumeParent()) return;
    if (authStore.get().status !== 'guest') authActions.signOutLocal();
    return;
  }
  authStore.set((state) => (state.accessToken === accessToken ? state : { ...state, accessToken }));
  persist();
});

/** Tài khoản trong app game phải là phụ huynh (nhân viên dùng trang quản trị; bé không đăng nhập) */
function assertParent(session: AuthSession): void {
  if (session.user.isParent) return;
  // Không giữ phiên vừa mở (nhân viên đăng nhập nhầm app)
  if (session.refreshToken) void authService.logout(session.refreshToken).catch(() => {});
  throw new ApiError(403, ClientErrorCode.NOT_FAMILY_ACCOUNT, 'Not a family account');
}

function applyParent(session: AuthSession): void {
  assertParent(session);
  authStore.set({
    status: 'signedIn',
    user: session.user,
    accessToken: session.accessToken,
    parent: null,
    parentRefreshToken: null,
  });
  setTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken ?? null });
  clearRequestCache();
  persist();
}

export const authActions = {
  /** Mở app: có refresh token thì lấy access token mới + user mới nhất */
  async restore(): Promise<void> {
    if (authStore.get().status !== 'restoring') return;
    try {
      const session = await authService.refreshSession();
      if (!session) return; // tokenStore đã bị xoá -> listener về phiên phụ huynh / khách
      authStore.set((state) => ({
        ...state,
        status: 'signedIn',
        user: session.user ?? state.user,
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

  /** Phụ huynh đăng nhập email / mật khẩu */
  async login(body: LoginBody): Promise<void> {
    applyParent(await authService.login(body));
  },

  /** Phụ huynh đăng nhập Google. Email chưa có tài khoản gia đình → 422 PROFILE_REQUIRED (nhờ trung tâm tạo) */
  async google(idToken: string): Promise<void> {
    applyParent(await authService.googleSignIn({ idToken, app: 'game' }));
  },

  /** Đặt mật khẩu từ link mời (mail `parent.invite`) → đăng nhập luôn */
  async setPassword(body: SetPasswordBody): Promise<void> {
    applyParent(await authService.setPassword(body));
  },

  /** Danh sách hồ sơ các bé (phiên phụ huynh) */
  async profiles(): Promise<FamilyProfileModel[]> {
    await authActions.backToParent();
    return authService.profiles();
  },

  /** Vào hồ sơ bé: phiên phụ huynh đỗ lại, phiên bé thành phiên đang dùng */
  async switchProfile(studentId: string): Promise<void> {
    await authActions.backToParent();
    const { user: parent } = authStore.get();
    const parentRefreshToken = tokenStore.get().refreshToken;
    if (!parent?.isParent || !parentRefreshToken) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Family session required');
    }
    const child = await authService.switchProfile({ studentId });
    if (!child.refreshToken)
      throw new ApiError(200, ClientErrorCode.BAD_RESPONSE, 'Missing child refresh token');
    // Phiên phụ huynh có thể đã xoay refresh token trong lúc gọi (401 → refresh)
    const latestParentToken = tokenStore.get().refreshToken ?? parentRefreshToken;
    // Đặt token của bé TRƯỚC: store đồng bộ (điểm chờ gửi, bài tập) nghe đổi bé sẽ gọi API bằng token của bé
    clearRequestCache();
    setTokens({ accessToken: child.accessToken, refreshToken: child.refreshToken ?? null });
    authStore.set({
      status: 'signedIn',
      user: child.user,
      accessToken: child.accessToken,
      parent,
      parentRefreshToken: latestParentToken,
    });
    persist();
  },

  /** Rời hồ sơ bé (đổi bé / đăng xuất): thu hồi phiên bé rồi lấy lại phiên phụ huynh */
  async backToParent(): Promise<void> {
    const { parent, parentRefreshToken } = authStore.get();
    if (!parent || !parentRefreshToken) return;
    const childRefreshToken = tokenStore.get().refreshToken;
    resumeParent();
    if (childRefreshToken) await authService.logout(childRefreshToken).catch(() => {});
  },

  /** Đăng xuất: thu hồi cả phiên bé lẫn phiên phụ huynh (không bắt buộc thành công) rồi xoá local */
  async signOut(): Promise<void> {
    const tokens = [tokenStore.get().refreshToken, authStore.get().parentRefreshToken].filter(
      (token): token is string => !!token,
    );
    authActions.signOutLocal();
    await Promise.all(tokens.map((token) => authService.logout(token).catch(() => {})));
  },

  /** Xoá phiên trên máy này (token hết hạn / bị thu hồi / đăng xuất) */
  signOutLocal(): void {
    // Về khách TRƯỚC rồi mới xoá token: listener của tokenStore thấy đã là khách thì không gọi lại hàm này
    authStore.set({ status: 'guest', user: null, accessToken: null, parent: null, parentRefreshToken: null });
    clearTokens();
    removeKeys([AUTH_KEY]);
    // Bỏ dữ liệu đã cache của người vừa đăng xuất (máy dùng chung)
    clearRequestCache();
  },
};

export const useAuth = (): AuthState => useStore(authStore, (state) => state);

/** Đang có hồ sơ bé được chọn — điểm / bài tập / mở khoá game ghi cho bé này */
export const isSignedIn = (state: AuthState = authStore.get()): boolean =>
  state.status === 'signedIn' && state.user !== null && state.user.isStudent;

/** Id bé đang chơi (null: khách, hoặc phụ huynh chưa chọn bé) */
export const activeStudentId = (state: AuthState = authStore.get()): string | null =>
  isSignedIn(state) ? state.user!.id : null;

/** Đã đăng nhập tài khoản gia đình (đang ở phiên phụ huynh hoặc phiên bé) */
export const isFamilySignedIn = (state: AuthState = authStore.get()): boolean =>
  state.status === 'signedIn' && state.user !== null && (state.user.isParent || state.parent !== null);

/**
 * Gọi `onChange(id, previous)` mỗi khi bé đang chơi đổi (khách → bé, bé A → bé B, bé → phụ huynh / khách).
 * Dùng cho store đồng bộ (catalog, bài tập, điểm chờ gửi): đổi bé thì bỏ dữ liệu của bé trước, tải của bé mới.
 */
export function watchActiveStudent(
  onChange: (id: string | null, previous: string | null) => void,
): () => void {
  let current = activeStudentId();
  return authStore.subscribe(() => {
    const next = activeStudentId();
    if (next === current) return;
    const previous = current;
    current = next;
    onChange(next, previous);
  });
}
