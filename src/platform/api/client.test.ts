import { API_PREFIX } from '@phonics/contracts';
import { z } from 'zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/platform/account/config', () => ({
  API_URL: 'http://api.test',
  GOOGLE_CLIENT_ID: '',
  ACCOUNT_ENABLED: true,
}));

import { ApiError, request, setTokens, tokenStore } from '@/platform/api/client';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const authBody = (accessToken: string, refreshToken: string) => ({
  accessToken,
  refreshToken,
  expiresIn: 900,
  user: {
    id: '0b1e6f2e-1c3a-4e5b-9d7f-123456789abc',
    email: 'kid@example.com',
    role: 'STUDENT',
    status: 'ACTIVE',
    provider: 'LOCAL',
    displayName: 'Kid',
    avatarKey: 'pip',
    class: null,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
});

describe('api client request', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    setTokens({ accessToken: 'old-access', refreshToken: 'old-refresh' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('401 -> refresh một lần -> gọi lại với token mới, lưu refresh token xoay vòng', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'expired' }))
      .mockResolvedValueOnce(json(200, authBody('new-access', 'new-refresh')))
      .mockResolvedValueOnce(json(200, { ok: true }));

    const result = await request('/me/points', { schema: z.object({ ok: z.boolean() }) });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [, refreshCall, retryCall] = fetchMock.mock.calls;
    expect(refreshCall[0]).toBe(`http://api.test${API_PREFIX}/auth/refresh`);
    expect((refreshCall[1]?.headers as Record<string, string>)['X-Refresh-Transport']).toBe('body');
    expect((retryCall[1]?.headers as Record<string, string>).Authorization).toBe('Bearer new-access');
    expect(tokenStore.get()).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
  });

  it('refresh bị từ chối -> xoá token, ném ApiError (không gọi lại)', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'expired' }))
      .mockResolvedValueOnce(json(401, { statusCode: 401, code: 'INVALID_REFRESH', message: 'bad' }));

    await expect(request('/me/points', { schema: z.object({}) })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tokenStore.get()).toEqual({ accessToken: null, refreshToken: null });
  });

  it('mất mạng -> ApiError.isNetworkError', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const error = await request('/public/games', { auth: 'none', schema: z.object({}) }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkError).toBe(true);
  });
});
