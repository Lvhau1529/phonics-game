/**
 * Bố cục màn chơi (toạ độ logic — platform/phaser/view.ts):
 *   dọc  : hàng 1 (tạm dừng · tim · điểm · giờ) / hàng 2 mục tiêu + loa / hàng 3 Growth + FRENZY / vùng bơi
 *   ngang: tạm dừng · tim bên trái, điểm · giờ bên phải, mục tiêu + Growth + FRENZY ở giữa / vùng bơi
 */
import Phaser from 'phaser';
import { isLandscape, view } from '@/core/phaser/view';

export interface OceanLayout {
  landscape: boolean;
  width: number;
  height: number;
  /** Tâm hàng nút / tim / điểm / giờ */
  topY: number;
  target: { x: number; y: number; width: number; height: number };
  growth: { x: number; y: number; width: number };
  /** Thanh FRENZY cạnh thanh Growth (x = mép trái) */
  frenzy: { x: number; y: number; width: number };
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
      growth: { x: width / 2 - 45, y: 70, width: 200 },
      frenzy: { x: width / 2 + 75, y: 70, width: 84 },
      play: new Phaser.Geom.Rectangle(0, 84, width, height - 84),
    };
  }
  return {
    landscape,
    width,
    height,
    topY: 24,
    target: { x: width / 2, y: 74, width: 280, height: 50 },
    growth: { x: width / 2 - 38, y: 112, width: 150 },
    frenzy: { x: width / 2 + 54, y: 112, width: 62 },
    play: new Phaser.Geom.Rectangle(0, 126, width, height - 126),
  };
}
