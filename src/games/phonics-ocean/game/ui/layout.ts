/**
 * Bố cục màn chơi (toạ độ logic — platform/phaser/view.ts):
 *   dọc  : hàng 1 (tạm dừng · tim · điểm · giờ) / hàng 2 mục tiêu + loa / hàng 3 thanh Growth / vùng bơi
 *   ngang: tạm dừng · tim bên trái, điểm · giờ bên phải, mục tiêu + Growth ở giữa / vùng bơi
 */
import Phaser from 'phaser';
import { isLandscape, view } from '@/platform/phaser/view';

export interface OceanLayout {
  landscape: boolean;
  width: number;
  height: number;
  /** Tâm hàng nút / tim / điểm / giờ */
  topY: number;
  target: { x: number; y: number; width: number; height: number };
  growth: { x: number; y: number; width: number };
  /** Vùng cá bơi */
  play: Phaser.Geom.Rectangle;
}

export function oceanLayout(scene: Phaser.Scene): OceanLayout {
  const { width, height } = view(scene);
  const landscape = isLandscape(scene);
  if (landscape) {
    return {
      landscape,
      width,
      height,
      topY: 26,
      target: { x: width / 2, y: 32, width: 300, height: 50 },
      growth: { x: width / 2, y: 70, width: 220 },
      play: new Phaser.Geom.Rectangle(0, 84, width, height - 84),
    };
  }
  return {
    landscape,
    width,
    height,
    topY: 24,
    target: { x: width / 2, y: 74, width: 280, height: 50 },
    growth: { x: width / 2, y: 112, width: 210 },
    play: new Phaser.Geom.Rectangle(0, 126, width, height - 126),
  };
}
