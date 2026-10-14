/**
 * Preset chữ của Phonics Ocean để UI nhất quán (chữ render sắc nét — platform/phaser/text.ts).
 */
import type Phaser from 'phaser';
import { THEME } from '@/games/phonics-ocean/game/config/theme';
import { crispText } from '@/core/phaser/text';

const { colors, fonts } = THEME;

const PRESETS = {
  /** Chữ lớn giữa màn hình (GET READY!, LEVEL CLEAR!...) */
  banner: { fontSize: '36px', fontStyle: '800', color: colors.gold, stroke: colors.ink, strokeThickness: 8 },
  /** Chữ nổi trên nền, có viền */
  outline: {
    fontSize: '16px',
    fontStyle: '800',
    color: colors.white,
    stroke: colors.ink,
    strokeThickness: 5,
  },
  /** Điểm bay lên */
  popup: { fontSize: '20px', fontStyle: '800', color: colors.gold, stroke: colors.ink, strokeThickness: 5 },
  /** Chữ học (âm / vần / từ) — font Andika dành cho trẻ tập đọc */
  learning: { fontFamily: fonts.learning, fontSize: '30px', fontStyle: '700', color: colors.ink },
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
