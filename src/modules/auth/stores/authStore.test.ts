import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@phonics/contracts';

vi.mock('@/core/config/account', () => ({
  ACCOUNT_ENABLED: true,
  API_URL: 'http://api',
  OFFLINE_MODE: false,
}));

const service = vi.hoisted(() => ({
  login: vi.fn(),
  googleSignIn: vi.fn(),
  setPassword: vi.fn(),
  profiles: vi.fn(),
  switchProfile: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
}));
vi.mock('@/modules/auth/services/authService', () => ({ authService: service }));

const { UserModel } = await import('@/modules/auth/models/UserModel');
const { tokenStore, clearTokens } = await import('@/core/api/client');
const store = await import('@/modules/auth/stores/authStore');
const { authActions, authStore, isSignedIn, isFamilySignedIn, watchActiveStudent, AUTH_KEY } = store;

const user = (id: string, role: User['role'], displayName: string) =>
  new UserModel({
    id,
    email: role === 'STUDENT' ? null : `${displayName.toLowerCase()}@example.com`,
    role,
    status: 'ACTIVE',
    provider: 'LOCAL',
    displayName,
    avatarKey: 'pip',
    class: null,
    createdAt: '2026-09-01T00:00:00.000Z',
  });

const parent = user('11111111-1111-4111-8111-111111111111', 'PARENT', 'Lan');
const child = user('22222222-2222-4222-8222-222222222222', 'STUDENT', 'Andy');
const session = (u: InstanceType<typeof UserModel>, refreshToken: string) => ({
  accessToken: `access-${refreshToken}`,
  refreshToken,
  expiresIn: 900,
  user: u,
});

describe('authStore (tài khoản gia đình)', () => {
  beforeEach(() => {
    service.logout.mockResolvedValue(undefined);
  });
  afterEach(() => {
    authActions.signOutLocal();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('phụ huynh đăng nhập: phiên gia đình, chưa có bé đang chơi', async () => {
    service.login.mockResolvedValue(session(parent, 'rt-parent'));
    await authActions.login({ email: 'lan@example.com', password: 'secret1' });
    expect(isFamilySignedIn()).toBe(true);
    expect(isSignedIn()).toBe(false);
    expect(tokenStore.get().refreshToken).toBe('rt-parent');
  });

  it('tài khoản không phải phụ huynh (giáo viên) bị từ chối, phiên vừa mở bị thu hồi', async () => {
    service.login.mockResolvedValue(
      session(user('33333333-3333-4333-8333-333333333333', 'TEACHER', 'Hoa'), 'rt-t'),
    );
    await expect(authActions.login({ email: 'hoa@example.com', password: 'secret1' })).rejects.toMatchObject({
      code: 'NOT_FAMILY_ACCOUNT',
    });
    expect(authStore.get().status).toBe('guest');
    expect(service.logout).toHaveBeenCalledWith('rt-t');
  });

  it('chọn bé: phiên bé thành phiên đang dùng, phiên phụ huynh đỗ lại (lưu cả hai)', async () => {
    const changes: (string | null)[] = [];
    const stop = watchActiveStudent((id) => changes.push(id));
    service.login.mockResolvedValue(session(parent, 'rt-parent'));
    service.switchProfile.mockResolvedValue(session(child, 'rt-child'));
    await authActions.login({ email: 'lan@example.com', password: 'secret1' });
    await authActions.switchProfile(child.id);

    expect(isSignedIn()).toBe(true);
    expect(authStore.get().user?.id).toBe(child.id);
    expect(authStore.get().parent?.id).toBe(parent.id);
    expect(tokenStore.get().refreshToken).toBe('rt-child');
    const saved = JSON.parse(localStorage.getItem(AUTH_KEY) ?? '{}') as {
      refreshToken: string;
      parent: { refreshToken: string };
    };
    expect(saved.refreshToken).toBe('rt-child');
    expect(saved.parent.refreshToken).toBe('rt-parent');
    expect(changes).toEqual([child.id]);
    stop();
  });

  it('về màn chọn bé: thu hồi phiên bé, lấy lại phiên phụ huynh', async () => {
    service.login.mockResolvedValue(session(parent, 'rt-parent'));
    service.switchProfile.mockResolvedValue(session(child, 'rt-child'));
    await authActions.login({ email: 'lan@example.com', password: 'secret1' });
    await authActions.switchProfile(child.id);
    await authActions.backToParent();

    expect(authStore.get().user?.id).toBe(parent.id);
    expect(authStore.get().parent).toBeNull();
    expect(tokenStore.get()).toEqual({ accessToken: null, refreshToken: 'rt-parent' });
    expect(service.logout).toHaveBeenCalledWith('rt-child');
  });

  it('phiên bé bị server từ chối → tự về phiên phụ huynh, không đăng xuất hẳn', async () => {
    service.login.mockResolvedValue(session(parent, 'rt-parent'));
    service.switchProfile.mockResolvedValue(session(child, 'rt-child'));
    await authActions.login({ email: 'lan@example.com', password: 'secret1' });
    await authActions.switchProfile(child.id);
    clearTokens(); // client xoá token khi refresh của bé bị từ chối

    expect(authStore.get().status).toBe('signedIn');
    expect(authStore.get().user?.id).toBe(parent.id);
    expect(tokenStore.get().refreshToken).toBe('rt-parent');
  });

  it('đăng xuất: thu hồi cả phiên bé lẫn phiên phụ huynh', async () => {
    service.login.mockResolvedValue(session(parent, 'rt-parent'));
    service.switchProfile.mockResolvedValue(session(child, 'rt-child'));
    await authActions.login({ email: 'lan@example.com', password: 'secret1' });
    await authActions.switchProfile(child.id);
    await authActions.signOut();

    expect(authStore.get().status).toBe('guest');
    expect(localStorage.getItem(AUTH_KEY)).toBeNull();
    expect(service.logout).toHaveBeenCalledWith('rt-child');
    expect(service.logout).toHaveBeenCalledWith('rt-parent');
  });
});
