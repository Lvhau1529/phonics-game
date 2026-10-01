import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/platform/account/config', () => ({
  API_URL: 'http://api.test',
  GOOGLE_CLIENT_ID: '',
  ACCOUNT_ENABLED: true,
}));

const postGameResult = vi.fn();
vi.mock('@/platform/account/accountApi', () => ({
  postGameResult: (...args: unknown[]) => postGameResult(...args),
}));

vi.mock('@/platform/account/authStore', async () => {
  const { createStore } = await import('@/shared/createStore');
  const authStore = createStore({
    status: 'signedIn',
    user: { id: 'user-1', displayName: 'Kid' },
    accessToken: 'token',
    pendingGoogleIdToken: null,
  });
  return { authStore, isSignedIn: () => authStore.get().status === 'signedIn' };
});

import { ApiError } from '@/platform/account/apiClient';
import { postSoloResult, SCORE_QUEUE_KEY, scoreSync, syncStore } from '@/platform/account/scoreSync';

const input = {
  gameId: 'bread-catcher' as const,
  levelId: 'easy',
  packId: 'blending_core',
  correct: 4,
  total: 5,
  score: 40,
  durationMs: 30_000,
  endedBy: 'completed' as const,
};

const response = {
  resultId: '0b1e6f2e-1c3a-4e5b-9d7f-123456789abc',
  duplicate: false,
  pointsAwarded: 4,
  totals: { all: 12, today: 4, game: 8 },
  rank: { previous: 3, current: 2 },
};

const flushIdle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('scoreSync', () => {
  beforeEach(async () => {
    postGameResult.mockReset();
    // Dọn hàng đợi còn sót từ test trước (gửi thành công hết)
    postGameResult.mockResolvedValue(response);
    await scoreSync.flush();
    postGameResult.mockClear();
    syncStore.set({ pending: [], last: null, saved: {}, failed: [], offline: false });
  });

  it('mất mạng -> xếp hàng (localStorage); có mạng -> gửi, xoá khỏi hàng đợi', async () => {
    postGameResult.mockRejectedValueOnce(new ApiError(0, 'NETWORK', 'offline'));
    const id = postSoloResult(input);
    expect(id).toBeTruthy();
    await flushIdle();
    expect(syncStore.get().pending).toEqual([id]);
    expect(syncStore.get().offline).toBe(true);
    expect(JSON.parse(localStorage.getItem(SCORE_QUEUE_KEY) ?? '{}').items).toHaveLength(1);

    postGameResult.mockResolvedValueOnce(response);
    await scoreSync.flush();
    expect(syncStore.get().pending).toEqual([]);
    expect(syncStore.get().saved[id!]).toEqual(response);
    expect(syncStore.get().last?.sessionId).toBe(id);
    expect(JSON.parse(localStorage.getItem(SCORE_QUEUE_KEY) ?? '{}').items).toHaveLength(0);
  });

  it('4xx (không phải 401 / 429) -> bỏ khỏi hàng đợi, đánh dấu bị từ chối', async () => {
    postGameResult.mockRejectedValueOnce(new ApiError(422, 'RESULT_IMPLAUSIBLE', 'nope'));
    const id = postSoloResult(input);
    await flushIdle();
    expect(syncStore.get().pending).toEqual([]);
    expect(syncStore.get().failed).toContain(id);
    expect(postGameResult).toHaveBeenCalledTimes(1);
  });

  it('5xx -> giữ lại chờ gửi sau', async () => {
    postGameResult.mockRejectedValue(new ApiError(503, 'INTERNAL', 'down'));
    const id = postSoloResult(input);
    await flushIdle();
    expect(syncStore.get().pending).toEqual([id]);
    await scoreSync.flush();
    expect(syncStore.get().pending).toEqual([id]);
    expect(postGameResult).toHaveBeenCalledTimes(2);
  });

  it('dữ liệu không hợp lệ (correct > total) -> không gửi, trả null', () => {
    expect(postSoloResult({ ...input, correct: 9 })).toBeNull();
    expect(postGameResult).not.toHaveBeenCalled();
  });
});
