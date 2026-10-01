/**
 * Hình ảnh / nhạc theo cấp độ và phần thưởng hình ảnh trong lượt chơi
 * (5 background, 4 tier rổ, 16 kiểu bánh — plan §29 + Kids Bakery pack).
 */
import { MUSIC, type MusicKey } from '@/games/bread-catcher/game/config/assets';
import type { LevelId } from '@/games/bread-catcher/session/types';

export type BasketTier = 1 | 2 | 3 | 4;

export const BASKET_TEXTURES: Record<BasketTier, string> = {
  1: 'basket_01',
  2: 'basket_02',
  3: 'basket_03',
  4: 'basket_04',
};

/** Rổ "lên đời" theo số từ đúng trong lượt: 0 -> 1, 1-2 -> 2, 3-4 -> 3, 5 -> 4 */
export function basketTierFor(correctWords: number): BasketTier {
  if (correctWords >= 5) return 4;
  if (correctWords >= 3) return 3;
  if (correctWords >= 1) return 2;
  return 1;
}

/**
 * Bánh chữ: 4 kiểu bánh pixel-art gốc (tròn / baguette / loaf / premium)
 * + 12 bánh ngọt có lòng kem trống của Kids Bakery pack (cookie, donut, croissant, muffin, su kem...).
 */
export const LETTER_BREADS = [
  ...['01', '02', '03', '04'].map((id) => `letter_bread_${id}`),
  ...Array.from({ length: 12 }, (_, index) => `letter_treat_${String(index + 1).padStart(2, '0')}`),
];

export interface StageDef {
  background: string;
  music: MusicKey;
}

/**
 * 01 Bakery Kitchen · 02 Village Bakery · 03 Premium Bakery (pack gốc)
 * 04 Sweet Shop (tiệm bánh ngọt hồng) · 05 Midnight Kitchen (bếp đêm bột tung toé) — Kids Bakery pack
 */
export const STAGE_BACKGROUNDS = [
  'bg_bakery_01',
  'bg_bakery_02',
  'bg_bakery_03',
  'bg_bakery_04',
  'bg_bakery_05',
] as const;

/** Gentle: Sweet Shop · Easy: Bakery Kitchen · Normal: Village · Fast: Premium · Hard: Midnight Kitchen */
export const LEVEL_STAGES: Record<LevelId, StageDef> = {
  gentle: { background: 'bg_bakery_04', music: MUSIC.GAMEPLAY_EASY },
  easy: { background: 'bg_bakery_01', music: MUSIC.GAMEPLAY_EASY },
  normal: { background: 'bg_bakery_02', music: MUSIC.GAMEPLAY_NORMAL },
  fast: { background: 'bg_bakery_03', music: MUSIC.GAMEPLAY_NORMAL },
  hard: { background: 'bg_bakery_05', music: MUSIC.GAMEPLAY_NORMAL },
};
