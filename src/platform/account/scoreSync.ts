/**
 * Đồng bộ kết quả ván SOLO của học sinh đã đăng nhập lên API (POST /game/results) -> điểm + xếp hạng lớp.
 *
 *   - Game gọi `postSoloResult` khi ván kết thúc; trả về clientSessionId (khoá idempotent) để màn kết quả
 *     hiện trạng thái (<PointsSynced sessionId />), hoặc null khi là khách / tắt tài khoản / dữ liệu lỗi.
 *   - Hàng đợi localStorage `phonics-arcade:score-queue`, gửi tuần tự (syncQueue): offline thì chờ, có mạng /
 *     quay lại tab / đăng nhập lại là gửi. Ván quá 24h (POINT_RULES.playedAtMaxAgeMs) server không nhận -> bỏ.
 *   - Khách KHÔNG xếp hàng (máy lớp dùng chung); mục của người dùng khác (đổi tài khoản) giữ lại chờ họ.
 */
import { GameResultBody, POINT_RULES, type GameResultResponse } from '@phonics/contracts';
import { resultsService } from '@/platform/account/api/resultsService';
import { authStore, isSignedIn } from '@/platform/account/authStore';
import { ACCOUNT_ENABLED } from '@/platform/account/config';
import { createSyncQueue } from '@/platform/account/syncQueue';
import { createStore } from '@/shared/createStore';

export const SCORE_QUEUE_KEY = 'phonics-arcade:score-queue';

export interface QueuedResult {
  userId: string;
  body: GameResultBody;
}

/** Game truyền `manifest.id`; game API chưa biết (không có trong contracts GameId) thì không gửi */
export type SoloResultInput = Omit<
  GameResultBody,
  'clientSessionId' | 'mode' | 'playedAt' | 'details' | 'gameId'
> & {
  gameId: string;
  details?: Record<string, unknown>;
};

export interface SyncState {
  /** clientSessionId các ván đang chờ gửi */
  pending: string[];
  /** Ván gửi xong gần nhất (màn kết quả hiện "+N POINTS") */
  last: { sessionId: string; result: GameResultResponse } | null;
  /** Mọi ván đã gửi xong trong phiên này (chơi lại nhiều ván liên tiếp) */
  saved: Record<string, GameResultResponse>;
  /** Ván bị server từ chối */
  failed: string[];
  /** Lần gửi gần nhất thất bại vì mất mạng */
  offline: boolean;
}

export const syncStore = createStore<SyncState>({
  pending: [],
  last: null,
  saved: {},
  failed: [],
  offline: false,
});

const queue = createSyncQueue<QueuedResult>({
  key: SCORE_QUEUE_KEY,
  sanitize(item) {
    const value = item as Partial<QueuedResult> | null;
    if (!value || typeof value.userId !== 'string') return null;
    const body = GameResultBody.safeParse(value.body);
    return body.success ? { userId: value.userId, body: body.data } : null;
  },
  canSend: (item) => item.userId === authStore.get().user?.id,
  async send(item) {
    const result = await resultsService.post(item.body);
    syncStore.set((state) => ({
      ...state,
      offline: false,
      last: { sessionId: item.body.clientSessionId, result },
      saved: { ...state.saved, [item.body.clientSessionId]: result },
    }));
  },
  onReject(item) {
    syncStore.set((state) => ({ ...state, failed: [...state.failed, item.body.clientSessionId] }));
  },
});

const syncPending = () =>
  syncStore.set((state) => ({
    ...state,
    pending: queue.store.get().items.map((it) => it.body.clientSessionId),
  }));
queue.store.subscribe(syncPending);
syncPending();

function dropExpired(): void {
  const oldest = Date.now() - POINT_RULES.playedAtMaxAgeMs;
  queue.prune((item) => Date.parse(item.body.playedAt) >= oldest);
}

export const scoreSync = {
  /** Gửi các ván đang chờ (không ném lỗi) */
  async flush(): Promise<void> {
    if (!ACCOUNT_ENABLED || !isSignedIn()) return;
    dropExpired();
    await queue.flush();
    const error = queue.lastError();
    const offline =
      !!error && typeof error === 'object' && 'isNetworkError' in error && !!error.isNetworkError;
    syncStore.set((state) => (state.offline === offline ? state : { ...state, offline }));
  },

  /** Gắn các mốc tự gửi lại: mở app, có mạng, quay lại tab, đăng nhập */
  init(): void {
    if (!ACCOUNT_ENABLED) return;
    window.addEventListener('online', () => void scoreSync.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void scoreSync.flush();
    });
    let wasSignedIn = isSignedIn();
    authStore.subscribe(() => {
      const now = isSignedIn();
      if (now && !wasSignedIn) void scoreSync.flush();
      wasSignedIn = now;
    });
    void scoreSync.flush();
  },
};

/**
 * Xếp hàng gửi kết quả ván solo vừa chơi xong. Trả về clientSessionId, hoặc null khi không gửi
 * (khách, tắt tài khoản, dữ liệu không hợp lệ).
 */
export function postSoloResult(input: SoloResultInput): string | null {
  if (!ACCOUNT_ENABLED) return null;
  const { user } = authStore.get();
  if (!isSignedIn() || !user) return null;
  const parsed = GameResultBody.safeParse({
    ...input,
    details: input.details ?? {},
    clientSessionId: crypto.randomUUID(),
    mode: 'solo',
    playedAt: new Date().toISOString(),
  });
  if (!parsed.success) {
    console.warn('[Phonics Arcade] Invalid game result, not synced:', parsed.error.issues);
    return null;
  }
  queue.push({ userId: user.id, body: parsed.data });
  void scoreSync.flush();
  return parsed.data.clientSessionId;
}
