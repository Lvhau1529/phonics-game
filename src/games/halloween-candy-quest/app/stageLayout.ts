/**
 * Hình học sân khấu (px thế giới 320×180 -> px màn hình): chỗ đứng trước nhà, đường đi của lượt, thời gian đi,
 * tỉ lệ phóng + camera theo nhân vật (màn dọc: cắt bớt hai bên, không bóp méo nền — spec §13.2).
 */
import { ENTRY_X, HOUSE_SLOTS, WORLD_HEIGHT, WORLD_WIDTH } from '@/games/halloween-candy-quest/content/world';
import type { Game } from '@/games/halloween-candy-quest/session/types';

/** Nhân vật đứng bên trái cửa để không che cửa */
export const standX = (house: number): number => HOUSE_SLOTS[house] - 26;

/** Đi từ đâu tới đâu ở lượt hiện tại: lượt đầu của khu vực vào từ mép trái, còn lại đi từ nhà trước */
export function walkPath(game: Game): { from: number; to: number } {
  const current = game.plan[game.turn];
  const previous = game.plan[game.turn - 1];
  const from = !previous || previous.zone !== current.zone ? ENTRY_X : standX(previous.house);
  return { from, to: standX(current.house) };
}

/** Ngắn 0.9–2.6 giây (spec §5.3: tự đi 1–3 giây) */
export function walkMs(from: number, to: number): number {
  return Math.round(Math.min(2600, Math.max(900, (Math.abs(to - from) / 90) * 1000)));
}

/** Ít nhất ngần này px thế giới bề ngang luôn thấy được (khoảng 1,5 ngôi nhà — camera đi theo nhân vật) */
const MIN_VISIBLE_WIDTH = 120;

export interface Camera {
  scale: number;
  x: number;
  y: number;
}

/** Phóng vừa khung; khung hẹp (điện thoại dọc) thì phóng theo bề ngang tối thiểu và đi theo `focusX` */
export function cameraFor(width: number, height: number, focusX: number): Camera {
  if (width <= 0 || height <= 0) return { scale: 1, x: 0, y: 0 };
  const scale = Math.min(height / WORLD_HEIGHT, Math.max(width / WORLD_WIDTH, width / MIN_VISIBLE_WIDTH));
  const worldWidth = WORLD_WIDTH * scale;
  const worldHeight = WORLD_HEIGHT * scale;
  const x =
    worldWidth <= width
      ? (width - worldWidth) / 2
      : Math.min(0, Math.max(width - worldWidth, width / 2 - focusX * scale));
  return { scale, x: Math.round(x), y: Math.round(Math.max(0, (height - worldHeight) / 2)) };
}
