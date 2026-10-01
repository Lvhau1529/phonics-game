/**
 * Sự kiện ẩn danh cho thống kê game (POST /public/events):
 *   VIEW — bấm thẻ game ở màn chọn game (lúc thật sự mở game)
 *   PLAY — chơi xong một ván (mọi game, mọi chế độ, cả khách) — TRỪ ván solo của học sinh đã đăng nhập
 *          (server tự ghi PLAY từ kết quả gửi lên, tránh đếm đôi)
 * `clientId` là UUID ngẫu nhiên của thiết bị (`phonics-arcade:client-id`), không phải thông tin cá nhân.
 * Gom tối đa EVENT_BATCH_MAX sự kiện một lần, hàng đợi `phonics-arcade:event-queue`; gửi khi có mạng /
 * quay lại tab / đóng trang (fetch keepalive). Không có API (ACCOUNT_ENABLED=false) thì mọi hàm là no-op.
 */
import { EVENT_BATCH_MAX, EVENT_MAX_AGE_MS, GameEventInput, GameId, type PlayMode } from '@phonics/contracts';
import { postEvents } from '@/platform/account/accountApi';
import { isApiError } from '@/platform/account/apiClient';
import { ACCOUNT_ENABLED } from '@/platform/account/config';
import { readJson, writeJson } from '@/platform/storage';

export const CLIENT_ID_KEY = 'phonics-arcade:client-id';
export const EVENT_QUEUE_KEY = 'phonics-arcade:event-queue';

function clientId(): string {
  const stored = readJson<{ id: string }>(CLIENT_ID_KEY);
  if (stored && typeof stored.id === 'string' && stored.id) return stored.id;
  const id = crypto.randomUUID();
  writeJson(CLIENT_ID_KEY, { id });
  return id;
}

function load(): GameEventInput[] {
  const stored = readJson<{ items: unknown[] }>(EVENT_QUEUE_KEY);
  if (!Array.isArray(stored?.items)) return [];
  return stored.items
    .map((item) => GameEventInput.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
}

let items: GameEventInput[] = ACCOUNT_ENABLED ? load() : [];
let flushing = false;

const save = () => writeJson(EVENT_QUEUE_KEY, { items });

function track(event: Omit<GameEventInput, 'occurredAt'>): void {
  if (!ACCOUNT_ENABLED) return;
  // Game chưa có trong contracts (vd game mới chưa được API biết) thì bỏ qua
  if (!GameId.safeParse(event.gameId).success) return;
  items = [...items, { ...event, occurredAt: new Date().toISOString() }];
  save();
}

async function flush(keepalive = false): Promise<void> {
  if (!ACCOUNT_ENABLED || flushing) return;
  const oldest = Date.now() - EVENT_MAX_AGE_MS;
  items = items.filter((item) => Date.parse(item.occurredAt) >= oldest);
  if (items.length === 0) {
    save();
    return;
  }
  flushing = true;
  try {
    while (items.length > 0) {
      const batch = items.slice(0, EVENT_BATCH_MAX);
      await postEvents({ clientId: clientId(), events: batch }, keepalive);
      items = items.slice(batch.length);
      save();
      if (keepalive) break; // Trang đang đóng: chỉ kịp một lô
    }
  } catch (error) {
    // Mất mạng / server lỗi / 401 / 429: giữ lại, lần sau gửi. 4xx khác (dữ liệu hỏng) thì bỏ lô để không kẹt mãi
    const rejected =
      isApiError(error) && error.isClientError && error.statusCode !== 401 && error.statusCode !== 429;
    if (rejected) {
      items = items.slice(Math.min(items.length, EVENT_BATCH_MAX));
      save();
    }
  } finally {
    flushing = false;
  }
}

export const events = {
  /** Bấm thẻ game (mở game) */
  trackView(gameId: string): void {
    track({ gameId: gameId as GameId, type: 'VIEW' });
    void flush();
  },

  /** Chơi xong một ván */
  trackPlay(gameId: string, mode: PlayMode): void {
    track({ gameId: gameId as GameId, type: 'PLAY', mode });
    void flush();
  },

  flush: () => flush(),

  init(): void {
    if (!ACCOUNT_ENABLED) return;
    window.addEventListener('online', () => void flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void flush();
    });
    window.addEventListener('pagehide', () => void flush(true));
    void flush();
  },
};
