/**
 * Trạng thái mở / đóng hộp Hướng dẫn — màn nào của game cũng mở được (kèm phần cần cuộn tới),
 * game root hiển thị <GuideDialog> với nội dung của game đó.
 */
import { createStore } from '@/core/store/createStore';

export const guideStore = createStore<{ open: boolean; section: string | null }>({
  open: false,
  section: null,
});

/** `section`: id phần cần mở; bỏ trống = phần đầu tiên */
export function openGuide(section: string | null = null): void {
  guideStore.set({ open: true, section });
}

export function closeGuide(): void {
  guideStore.set((state) => ({ ...state, open: false }));
}
