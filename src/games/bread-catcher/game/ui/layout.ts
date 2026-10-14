/**
 * Bố cục HUD theo hướng màn hình:
 *
 *   Dọc (điện thoại)            Ngang (máy chiếu / máy tính / tablet)
 *   [đội]          [⏱]          [đội] SCORE  WORD 2/5      [⏱] [⏸][↩][■]
 *   SCORE WORD  [⏸][↩][■]               ┌── ô từ (giữa) ──┐
 *   ┌────── ô từ ──────┐
 *
 * `playTop`: chữ bắt đầu rơi từ đây (ngay dưới ô từ).
 */
import type Phaser from 'phaser';
import { isLandscape, view } from '@/core/phaser/view';

export interface HudLayout {
  landscape: boolean;
  /** Y của hàng chứa điểm / số từ / nút giáo viên */
  controlsY: number;
  scoreX: number;
  wordX: number;
  /** Tâm X của đồng hồ */
  timerX: number;
  shadeHeight: number;
  panel: { x: number; y: number; width: number; height: number };
  playTop: number;
}

const PANEL_HEIGHT = { portrait: 88, landscape: 84 };
const MAX_LANDSCAPE_PANEL_WIDTH = 620;

export function hudLayout(scene: Phaser.Scene): HudLayout {
  const { width } = view(scene);
  if (isLandscape(scene)) {
    const panelWidth = Math.min(MAX_LANDSCAPE_PANEL_WIDTH, width - 40);
    const panel = { x: width / 2, y: 54, width: panelWidth, height: PANEL_HEIGHT.landscape };
    return {
      landscape: true,
      controlsY: 26,
      scoreX: 216,
      wordX: 336,
      timerX: width - 196,
      shadeHeight: 60,
      panel,
      playTop: panel.y + panel.height + 4,
    };
  }
  const panel = { x: width / 2, y: 92, width: width - 20, height: PANEL_HEIGHT.portrait };
  return {
    landscape: false,
    controlsY: 62,
    scoreX: 12,
    wordX: 118,
    timerX: width - 58,
    shadeHeight: 90,
    panel,
    playTop: panel.y + panel.height + 4,
  };
}
