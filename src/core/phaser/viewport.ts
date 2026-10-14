/**
 * Kích thước "logic" của game Phaser theo hướng màn hình lúc mở game — dùng chung cho mọi game:
 *   - Dọc (điện thoại):  rộng 360, cao 640..800 tuỳ tỉ lệ máy
 *   - Ngang (máy chiếu lớp học, máy tính, tablet): cao 540, rộng 720..960 (4:3 .. 16:9)
 * Canvas thật được render gấp RENDER_SCALE lần (camera zoom, xem view.ts) để chữ học hiển thị
 * sắc nét, còn sprite pixel-art vẫn phóng to kiểu nearest-neighbor.
 */
export const PORTRAIT = { width: 360, minHeight: 640, maxHeight: 800 } as const;
export const LANDSCAPE = { height: 540, minWidth: 720, maxWidth: 960 } as const;
export const RENDER_SCALE = 2;

export type Orientation = 'portrait' | 'landscape';

/**
 * Ngang khi màn hình rộng hơn cao — trừ điện thoại xoay ngang (chạm + thấp ≤ 540px):
 * điện thoại luôn chơi dọc, CSS hiện lời nhắc xoay máy (xem .rotate-hint).
 */
export function currentOrientation(): Orientation {
  const { innerWidth, innerHeight } = window;
  const isPhoneLandscape = window.matchMedia('(pointer: coarse)').matches && innerHeight <= 540;
  return innerWidth > innerHeight && !isPhoneLandscape ? 'landscape' : 'portrait';
}

export function computeGameSize(): { width: number; height: number } {
  const { innerWidth, innerHeight } = window;
  // Viewport chưa có kích thước (tab ẩn, iframe chưa layout...) -> dùng mặc định
  if (!innerWidth || !innerHeight) return { width: PORTRAIT.width, height: PORTRAIT.minHeight };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));
  if (currentOrientation() === 'landscape') {
    const width = clamp(
      (LANDSCAPE.height * innerWidth) / innerHeight,
      LANDSCAPE.minWidth,
      LANDSCAPE.maxWidth,
    );
    return { width, height: LANDSCAPE.height };
  }
  const height = clamp((PORTRAIT.width * innerHeight) / innerWidth, PORTRAIT.minHeight, PORTRAIT.maxHeight);
  return { width: PORTRAIT.width, height };
}
