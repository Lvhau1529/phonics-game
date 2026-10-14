/**
 * Bố cục màn chơi theo hướng màn hình (toạ độ logic, xem platform/phaser/view.ts):
 *
 *   Dọc (điện thoại)            Ngang (máy chiếu / máy tính)
 *   ┌──────── HUD ────────┐     ┌──────────── HUD ─────────────┐
 *   │   STAGE (stream)    │     │              │    PROMPT     │
 *   ├──────  PROMPT ──────┤     │    STAGE     ├── progress ───┤
 *   ├───── progress ──────┤     │   (stream)   │     TRAY      │
 *   │    TRAY (choices)   │     │              │   (choices)   │
 *   └─────────────────────┘     └──────────────┴───────────────┘
 */
import Phaser from 'phaser';
import { isLandscape, view } from '@/core/phaser/view';

export interface LiveLayout {
  landscape: boolean;
  hud: Phaser.Geom.Rectangle;
  stage: Phaser.Geom.Rectangle;
  prompt: Phaser.Geom.Rectangle;
  progress: Phaser.Geom.Rectangle;
  tray: Phaser.Geom.Rectangle;
}

const HUD_HEIGHT = 44;
const MARGIN = 8;
const PROGRESS_HEIGHT = 16;

export function liveLayout(scene: Phaser.Scene): LiveLayout {
  const { width, height } = view(scene);
  const R = Phaser.Geom.Rectangle;
  const hud = new R(0, 0, width, HUD_HEIGHT);

  if (isLandscape(scene)) {
    const top = HUD_HEIGHT + 2;
    const stageWidth = Math.round(width * 0.5);
    const stage = new R(MARGIN + 2, top, stageWidth, height - top - MARGIN - 2);
    const right = stage.right + 12;
    const columnWidth = width - right - MARGIN - 2;
    const prompt = new R(right, top, columnWidth, 150);
    const progress = new R(right + 8, prompt.bottom + 8, columnWidth - 16, PROGRESS_HEIGHT);
    const tray = new R(right, progress.bottom + 8, columnWidth, height - progress.bottom - 8 - MARGIN);
    return { landscape: true, hud, stage, prompt, progress, tray };
  }

  const stage = new R(MARGIN, HUD_HEIGHT, width - MARGIN * 2, Math.round(height * 0.34));
  const prompt = new R(MARGIN, stage.bottom + 6, width - MARGIN * 2, 118);
  const progress = new R(MARGIN + 10, prompt.bottom + 6, width - MARGIN * 2 - 20, PROGRESS_HEIGHT);
  const tray = new R(MARGIN, progress.bottom + 6, width - MARGIN * 2, height - progress.bottom - 6 - MARGIN);
  return { landscape: false, hud, stage, prompt, progress, tray };
}

/** Chia `count` ô vào `area`: tối đa `perRow` ô mỗi hàng, căn giữa hàng cuối */
export function gridCells(
  area: Phaser.Geom.Rectangle,
  count: number,
  perRow: number,
): Phaser.Geom.Rectangle[] {
  const columns = Math.min(count, perRow);
  const rows = Math.ceil(count / columns);
  const cellWidth = area.width / columns;
  const cellHeight = area.height / rows;
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const inRow = row === rows - 1 ? count - row * columns : columns;
    const offset = (area.width - inRow * cellWidth) / 2;
    const column = index % columns;
    return new Phaser.Geom.Rectangle(
      area.x + offset + column * cellWidth,
      area.y + row * cellHeight,
      cellWidth,
      cellHeight,
    );
  });
}
