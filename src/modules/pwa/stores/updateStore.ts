/**
 * Cập nhật PWA khi có bản deploy mới.
 *
 * Mỗi bản build sinh `sw.js` chứa hash của từng file; trình duyệt so `sw.js` với bản đang chạy,
 * khác một byte là tải ngầm bản mới rồi báo `onNeedRefresh`. Không tự tải lại trang (có thể đang
 * giữa ván) — màn Home hiện nút cập nhật, người dùng bấm thì mới kích hoạt bản mới + reload.
 */
import { registerSW } from 'virtual:pwa-register';
import { createStore } from '@/core/store/createStore';

/** Tab mở lâu (máy chiếu cả buổi) vẫn tự hỏi bản mới định kỳ */
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export const updateStore = createStore<{ ready: boolean }>({ ready: false });

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

export function initPwa(): void {
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateStore.set({ ready: true });
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        // Offline hoặc đang cài bản khác thì bỏ qua, lần sau hỏi lại
        if (navigator.onLine && !registration.installing) registration.update().catch(() => {});
      };
      setInterval(check, CHECK_INTERVAL_MS);
      // Quay lại tab / mở lại máy sau giờ nghỉ: hỏi luôn, không chờ hết chu kỳ
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });
}

/** Kích hoạt service worker mới rồi tải lại trang */
export function applyUpdate(): void {
  void updateSW?.(true);
}
