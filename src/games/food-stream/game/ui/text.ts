/**
 * Preset chữ của Food Stream để UI nhất quán (chữ render sắc nét — platform/phaser/text.ts).
 */
import type Phaser from 'phaser';
import { THEME } from '@/games/food-stream/game/config/theme';
import { crispText } from '@/core/phaser/text';

const { colors, fonts } = THEME;

const PRESETS = {
  /** Chữ lớn giữa màn hình (GET READY!, TEAM A...) */
  banner: { fontSize: '36px', fontStyle: '800', color: colors.gold, stroke: colors.ink, strokeThickness: 8 },
  /** Chữ nổi trên nền, có viền */
  outline: {
    fontSize: '16px',
    fontStyle: '800',
    color: colors.white,
    stroke: colors.ink,
    strokeThickness: 5,
  },
  /** Chữ trên panel sáng */
  label: { fontSize: '15px', fontStyle: '800', color: colors.ink },
  /** Bình luận của khán giả */
  comment: { fontSize: '12px', fontStyle: '700', color: colors.ink },
  /** Điểm bay lên */
  popup: { fontSize: '22px', fontStyle: '800', color: colors.gold, stroke: colors.ink, strokeThickness: 5 },
  /** Chữ học (chữ cái / từ / âm) — font Andika dành cho trẻ tập đọc */
  learning: { fontFamily: fonts.learning, fontSize: '34px', fontStyle: '700', color: colors.ink },
} satisfies Record<string, Phaser.Types.GameObjects.Text.TextStyle>;

export type TextPreset = keyof typeof PRESETS;

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  preset: TextPreset = 'outline',
  overrides: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return crispText(scene, x, y, text, { fontFamily: fonts.ui, ...PRESETS[preset], ...overrides });
}
