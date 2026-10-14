/**
 * Toạ độ "logic" của game tách khỏi độ phân giải canvas thật.
 *   - Dọc (điện thoại):   rộng 360, cao 640–800
 *   - Ngang (máy chiếu):  cao 540, rộng 720–960
 *
 * Canvas được tạo lớn gấp RENDER_SCALE lần; mỗi scene gọi `setupView()` ở đầu
 * create() để camera zoom lại — toàn bộ code vẽ / layout chỉ dùng toạ độ logic.
 */
import type Phaser from 'phaser';
import { RENDER_SCALE } from '@/core/phaser/viewport';

export interface ViewSize {
  width: number;
  height: number;
}

/** Kích thước màn hình theo toạ độ logic */
export function view(scene: Phaser.Scene): ViewSize {
  return { width: scene.scale.width / RENDER_SCALE, height: scene.scale.height / RENDER_SCALE };
}

/** Bố cục ngang (máy chiếu lớp học / máy tính / tablet nằm ngang) */
export function isLandscape(scene: Phaser.Scene): boolean {
  const { width, height } = view(scene);
  return width > height;
}

/** Zoom camera chính để vùng logic phủ kín canvas */
export function setupView(scene: Phaser.Scene): ViewSize {
  const size = view(scene);
  scene.cameras.main.setZoom(RENDER_SCALE).centerOn(size.width / 2, size.height / 2);
  return size;
}
