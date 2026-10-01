/**
 * Hàng đợi gửi dữ liệu lên API, lưu localStorage để chơi offline xong vẫn đồng bộ được:
 *   - `push` thêm mục rồi `flush` ngay; `flush` gửi TUẦN TỰ, một lần chạy tại một thời điểm;
 *   - 2xx -> bỏ khỏi hàng đợi; 4xx (trừ 401 / 429) -> bỏ + báo `onReject` (gửi lại cũng vô ích);
 *   - mất mạng / 5xx / 401 / 429 -> dừng, giữ nguyên, lần flush sau thử lại (online, quay lại tab...).
 * Dùng cho kết quả ván (scoreSync), mở khoá game (gamesSync) và sự kiện ẩn danh (analytics/events).
 */
import { isApiError } from '@/platform/account/apiClient';
import { readJson, writeJson } from '@/platform/storage';
import { createStore, type Store } from '@/shared/createStore';

export interface SyncQueueOptions<T> {
  /** Key localStorage */
  key: string;
  /** Lọc mục đọc từ storage (bỏ dữ liệu hỏng / cũ) */
  sanitize: (item: unknown) => T | null;
  /** Gửi một mục; ném ApiError khi thất bại */
  send: (item: T) => Promise<void>;
  /** Mục chưa gửi được lúc này (vd của người dùng khác) — giữ lại trong hàng đợi */
  canSend?: (item: T) => boolean;
  /** Server từ chối hẳn (4xx) */
  onReject?: (item: T, error: unknown) => void;
  /** Gửi xong một mục */
  onSent?: (item: T) => void;
}

export interface SyncQueue<T> {
  store: Store<{ items: T[] }>;
  push: (item: T) => void;
  /** Gửi lần lượt các mục đang chờ; không bao giờ ném lỗi */
  flush: () => Promise<void>;
  /** Bỏ các mục thoả điều kiện (vd dữ liệu quá hạn) */
  prune: (keep: (item: T) => boolean) => void;
  /** Lỗi của lần gửi cuối cùng (null = thành công / chưa gửi) */
  lastError: () => unknown;
}

export function createSyncQueue<T>(options: SyncQueueOptions<T>): SyncQueue<T> {
  const { key, sanitize, send, canSend = () => true, onReject, onSent } = options;

  const stored = readJson<{ items: unknown[] }>(key);
  const initial = Array.isArray(stored?.items)
    ? stored.items.map(sanitize).filter((item): item is T => item !== null)
    : [];
  const store = createStore<{ items: T[] }>({ items: initial });
  store.subscribe(() => writeJson(key, store.get()));

  let flushing: Promise<void> | null = null;
  let lastError: unknown = null;

  const remove = (item: T) => store.set((state) => ({ items: state.items.filter((it) => it !== item) }));

  async function run(): Promise<void> {
    // Lấy snapshot; mục thêm vào trong lúc gửi sẽ được lần flush sau (gọi lại ở cuối) xử lý
    for (const item of store.get().items) {
      if (!canSend(item)) continue;
      try {
        await send(item);
        lastError = null;
        remove(item);
        onSent?.(item);
      } catch (error) {
        lastError = error;
        const retryLater =
          !isApiError(error) ||
          error.isNetworkError ||
          error.statusCode >= 500 ||
          error.statusCode === 401 ||
          error.statusCode === 429;
        if (retryLater) return;
        remove(item);
        onReject?.(item, error);
      }
    }
  }

  return {
    store,
    push(item) {
      store.set((state) => ({ items: [...state.items, item] }));
    },
    flush() {
      if (!flushing) {
        flushing = run()
          .catch(() => {})
          .finally(() => {
            flushing = null;
          });
      }
      return flushing;
    },
    prune(keep) {
      store.set((state) => {
        const items = state.items.filter(keep);
        return items.length === state.items.length ? state : { items };
      });
    },
    lastError: () => lastError,
  };
}
