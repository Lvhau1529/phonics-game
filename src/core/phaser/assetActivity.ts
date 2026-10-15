/**
 * Có game Phaser nào đang tải asset không — để việc nền nặng (PWA precache ~19 MB lần mở đầu) không tranh băng
 * thông với PreloadScene của game bé vừa mở.
 *
 * PhaserHost gọi `beginAssetLoad()` khi tạo game và hàm trả về khi ASSETS_READY (hoặc unmount trước đó).
 * File này không import Phaser — `main` (gói đầu) dùng được mà không kéo chunk Phaser theo.
 */
import { createStore } from '@/core/store/createStore';

export const assetActivity = createStore<{
  /** Số game đang tải asset */
  loading: number;
  /** Đã có game tải xong asset ít nhất một lần trong phiên */
  anyReady: boolean;
}>({ loading: 0, anyReady: false });

/** Bắt đầu tải asset của một game; gọi hàm trả về khi xong (`ready`) hoặc huỷ giữa chừng — gọi lại lần 2 vô hại */
export function beginAssetLoad(): (ready: boolean) => void {
  assetActivity.set((s) => ({ ...s, loading: s.loading + 1 }));
  let open = true;
  return (ready) => {
    if (!open) return;
    open = false;
    assetActivity.set((s) => ({ loading: s.loading - 1, anyReady: s.anyReady || ready }));
  };
}

/**
 * Chờ lúc rảnh để chạy việc nền: một game đã tải xong, hoặc đã qua `idleMs` — rồi chờ thêm cho tới khi không
 * còn game nào đang tải.
 */
export function whenAssetsIdle(idleMs: number): Promise<void> {
  return new Promise((resolve) => {
    let waited = false;
    const check = () => {
      const { loading, anyReady } = assetActivity.get();
      if ((waited || anyReady) && loading === 0) {
        window.clearTimeout(timer);
        unsubscribe();
        resolve();
      }
    };
    const timer = window.setTimeout(() => {
      waited = true;
      check();
    }, idleMs);
    const unsubscribe = assetActivity.subscribe(check);
    check();
  });
}
