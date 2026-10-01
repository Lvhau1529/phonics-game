/**
 * Thông báo của học sinh (điểm thưởng, đổi hạng, mở khoá game, lời nhắn của GV):
 * GET /me/notifications?unread=true khi mở app, quay lại tab và mỗi 5 phút lúc đang đăng nhập;
 * chuông ở màn chọn game hiện số chưa đọc; mở màn MESSAGES thì tải cả đã đọc và đánh dấu đã đọc.
 */
import type { NotificationView } from '@phonics/contracts';
import { getNotifications, markNotificationsRead } from '@/platform/account/accountApi';
import { authStore, isSignedIn } from '@/platform/account/authStore';
import { ACCOUNT_ENABLED } from '@/platform/account/config';
import { useStore } from '@/platform/hooks/useStore';
import { createStore } from '@/shared/createStore';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export interface NotificationsState {
  items: NotificationView[];
  unreadCount: number;
  loading: boolean;
  /** Đã tải được ít nhất một lần (màn MESSAGES biết lúc nào hiện "no messages") */
  loaded: boolean;
}

const EMPTY: NotificationsState = { items: [], unreadCount: 0, loading: false, loaded: false };

export const notificationsStore = createStore<NotificationsState>(EMPTY);

let timer = 0;

export const notificationsActions = {
  /** `unreadOnly`: chuông chỉ cần số chưa đọc; màn MESSAGES tải cả đã đọc */
  async refresh(unreadOnly = true): Promise<void> {
    if (!ACCOUNT_ENABLED || !isSignedIn()) return;
    notificationsStore.set((state) => ({ ...state, loading: true }));
    try {
      const { items, unreadCount } = await getNotifications(unreadOnly);
      notificationsStore.set((state) => ({
        ...state,
        // Chỉ tải chưa đọc thì giữ các mục đã đọc đang có (gộp theo id, mới nhất trước)
        items: unreadOnly ? merge(items, state.items) : items,
        unreadCount,
        loading: false,
        loaded: true,
      }));
    } catch {
      notificationsStore.set((state) => ({ ...state, loading: false }));
    }
  },

  /** Không có ids = tất cả */
  async markRead(ids?: string[]): Promise<void> {
    if (!ACCOUNT_ENABLED || !isSignedIn()) return;
    if (notificationsStore.get().unreadCount === 0 && !ids) return;
    try {
      const { unreadCount } = await markNotificationsRead(ids);
      const now = new Date().toISOString();
      notificationsStore.set((state) => ({
        ...state,
        unreadCount,
        items: state.items.map((item) =>
          item.readAt || (ids && !ids.includes(item.id)) ? item : { ...item, readAt: now },
        ),
      }));
    } catch {
      // Lần sau
    }
  },

  init(): void {
    if (!ACCOUNT_ENABLED) return;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => void notificationsActions.refresh(), POLL_INTERVAL_MS);
      void notificationsActions.refresh();
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = 0;
      notificationsStore.set(EMPTY);
    };
    let wasSignedIn = isSignedIn();
    authStore.subscribe(() => {
      const now = isSignedIn();
      if (now === wasSignedIn) return;
      wasSignedIn = now;
      if (now) start();
      else stop();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void notificationsActions.refresh();
    });
    if (wasSignedIn) start();
  },
};

function merge(fresh: NotificationView[], existing: NotificationView[]): NotificationView[] {
  const seen = new Set(fresh.map((item) => item.id));
  return [...fresh, ...existing.filter((item) => !seen.has(item.id))].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export const useNotifications = (): NotificationsState => useStore(notificationsStore, (state) => state);
export const useUnreadCount = (): number => useStore(notificationsStore, (state) => state.unreadCount);
