/**
 * Preset chữ dùng chung để UI nhất quán.
 * Mọi Text được render ở độ phân giải RENDER_SCALE để sắc nét khi camera zoom.
 */
import type Phaser from 'phaser';
import { THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { crispText } from '@/core/phaser/text';

const { colors, fonts } = THEME;

const PRESETS = {
  /** Tiêu đề lớn trên nền ảnh */
  title: {
    fontSize: '34px',
    fontStyle: '800',
    color: colors.gold,
    stroke: colors.darkBrown,
    strokeThickness: 8,
  },
  /** Tiêu đề trên panel kem */
  heading: { fontSize: '26px', fontStyle: '800', color: colors.brown },
  /** Nhãn trên panel kem */
  label: { fontSize: '16px', fontStyle: '700', color: colors.brown },
  /** Chữ có viền, nổi trên nền game */
  outline: {
    fontSize: '17px',
    fontStyle: '700',
    color: colors.cream,
    stroke: colors.darkBrown,
    strokeThickness: 5,
  },
  small: {
    fontSize: '13px',
    fontStyle: '600',
    color: colors.cream,
    stroke: colors.darkBrown,
    strokeThickness: 4,
  },
  /** Popup bay lên */
  popup: {
    fontSize: '22px',
    fontStyle: '800',
    color: colors.gold,
    stroke: colors.darkBrown,
    strokeThickness: 5,
  },
  /** Chữ học (chữ cái / từ) — font Andika */
  learning: {
    fontFamily: fonts.learning,
    fontSize: '30px',
    fontStyle: '700',
    color: colors.darkBrown,
  },
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
