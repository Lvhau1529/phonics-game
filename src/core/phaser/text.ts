/**
 * Chữ trên canvas Phaser dùng chung cho mọi game: render ở độ phân giải RENDER_SCALE
 * để sắc nét khi camera zoom (xem view.ts).
 */
import type Phaser from 'phaser';
import { RENDER_SCALE } from '@/core/phaser/viewport';

export function crispText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, { align: 'center', ...style })
    .setResolution(RENDER_SCALE)
    .setOrigin(0.5);
}

/**
 * Cắt chữ bằng "…" cho vừa `maxWidth` (px logic) — dùng cho tên đội dài
 * (vd "WWWWWWWWWWWW" rộng gấp đôi "IIIIIIIIIIII" dù cùng 12 ký tự).
 */
export function fitText(
  text: Phaser.GameObjects.Text,
  maxWidth: number,
  /** Phần đuôi luôn giữ lại, vd "!" trong "LIONS!" */
  suffix = '',
): Phaser.GameObjects.Text {
  if (text.width <= maxWidth) return text;
  const chars = [...text.text.slice(0, text.text.length - suffix.length)];
  while (chars.length > 1 && text.width > maxWidth) {
    chars.pop();
    text.setText(`${chars.join('').trimEnd()}…${suffix}`);
  }
  return text;
}
