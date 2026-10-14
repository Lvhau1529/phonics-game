/**
 * Texture nhỏ vẽ bằng code (bong bóng, lấp lánh) — pack chỉ có các ô hiệu ứng dính nền nên vẽ lại cho sạch.
 * Vẽ ở độ phân giải canvas (gấp RENDER_SCALE) để sắc nét khi camera zoom.
 */
import type Phaser from 'phaser';
import { RENDER_SCALE } from '@/core/phaser/viewport';

export const FX = {
  BUBBLE: 'fx.bubble',
  SPARK: 'fx.spark',
  DOT: 'fx.dot',
} as const;

/** Kích thước texture (px logic) — hiển thị bằng setDisplaySize */
export const FX_SIZE = { bubble: 16, spark: 16, dot: 8 } as const;

export function createFxTextures(scene: Phaser.Scene): void {
  const s = RENDER_SCALE;
  if (!scene.textures.exists(FX.BUBBLE)) {
    const r = (FX_SIZE.bubble / 2) * s;
    const g = scene.make.graphics({}, false);
    g.fillStyle(0xbff4ff, 0.25).fillCircle(r, r, r - 1);
    g.lineStyle(2, 0xe8fbff, 0.9).strokeCircle(r, r, r - 2);
    g.fillStyle(0xffffff, 0.95).fillCircle(r * 0.62, r * 0.6, r * 0.22);
    g.generateTexture(FX.BUBBLE, r * 2, r * 2);
    g.destroy();
  }
  if (!scene.textures.exists(FX.SPARK)) {
    const r = (FX_SIZE.spark / 2) * s;
    const g = scene.make.graphics({}, false);
    const points: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI / 4) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.32;
      points.push({ x: r + Math.cos(angle) * radius, y: r + Math.sin(angle) * radius });
    }
    g.fillStyle(0xfff3a0).fillPoints(points, true);
    g.fillStyle(0xffffff).fillCircle(r, r, r * 0.22);
    g.generateTexture(FX.SPARK, r * 2, r * 2);
    g.destroy();
  }
  if (!scene.textures.exists(FX.DOT)) {
    const r = (FX_SIZE.dot / 2) * s;
    const g = scene.make.graphics({}, false);
    g.fillStyle(0xffffff).fillCircle(r, r, r);
    g.generateTexture(FX.DOT, r * 2, r * 2);
    g.destroy();
  }
}
