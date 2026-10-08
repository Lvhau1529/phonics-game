/**
 * Theme + thông số cảm giác chơi của Phonics Ocean (xanh biển, gỗ HUD như art board của pack).
 */
import type { Biome, PredatorKind } from '@/games/phonics-ocean/content/schema';
import { FONTS } from '@/platform/phaser/fonts';

export const THEME = {
  fonts: FONTS,
  backgroundColor: '#06324f',
  colors: {
    ink: '#08263f',
    white: '#ffffff',
    gold: '#ffd23f',
    green: '#5ccf4a',
    red: '#ff4d5e',
    teal: '#20b8a6',
    sky: '#7fe3ff',
    orange: '#ffa62b',
  },
  /** Màu số (0x...) cho Graphics */
  hex: {
    ink: 0x08263f,
    navy: 0x0b3a5c,
    white: 0xffffff,
    gold: 0xffd23f,
    green: 0x5ccf4a,
    greenDark: 0x2f8f2a,
    red: 0xff4d5e,
    sky: 0x7fe3ff,
    wood: 0x9a5a26,
    woodDark: 0x5e3213,
    cream: 0xfff4dc,
  },
} as const;

export const DEPTH = {
  BACKGROUND: 0,
  AMBIENT: 5,
  ITEMS: 15,
  PREY: 20,
  PLAYER: 30,
  PREDATOR: 40,
  FX: 50,
  HUD: 70,
  BANNER: 80,
  OVERLAY: 100,
} as const;

/** Thông số chuyển động (px logic / giây) và thời lượng (ms) */
export const FEEL = {
  playerSpeed: 165,
  /** Độ "trơn" khi đổi hướng (càng nhỏ càng trôi) */
  playerTurn: 7,
  /** Tốc độ tối thiểu để chạm cá sai bị tính là "ăn nhầm" (đứng yên mà cá tự bơi vào thì không tính) */
  chaseMinSpeed: 45,
  /** Chiều cao cá người chơi theo cỡ 1–3 */
  playerHeight: { 1: 46, 2: 58, 3: 72 } as Record<number, number>,
  preyWidth: 54,
  preySpeed: { min: 26, max: 44 },
  predatorSpeed: 78,
  predatorHeight: { shark: 58, puffer: 50, eel: 40, angler: 56 } as Record<PredatorKind, number>,
  /** Cá săn mồi lượn theo bé (px/s theo trục dọc) */
  predatorHoming: 26,
  warningMs: 1300,
  stunMs: 700,
  hurtInvulnerableMs: 1800,
  rejectCooldownMs: 1400,
  shieldMs: 8000,
  powerUpEveryMs: 17000,
  powerUpLifeMs: 9000,
  nextQuestionDelay: 650,
  swimFrameMs: 110,
  biteMs: 260,
} as const;

/** Biome -> key ảnh nền + màu nước phủ lên (cho chữ trên cá dễ đọc) */
export const BIOMES: Record<Biome, { image: string; tint: number; tintAlpha: number }> = {
  coral_reef: { image: 'bg.coral_reef', tint: 0x0a4d7a, tintAlpha: 0.12 },
  shipwreck: { image: 'bg.shipwreck', tint: 0x06324f, tintAlpha: 0.15 },
  deep_ocean: { image: 'bg.deep_ocean', tint: 0x041d33, tintAlpha: 0.12 },
  ice_sea: { image: 'bg.ice_sea', tint: 0x0a4d7a, tintAlpha: 0.2 },
  volcano: { image: 'bg.volcano', tint: 0x2a0d06, tintAlpha: 0.25 },
  treasure_zone: { image: 'bg.treasure_zone', tint: 0x06324f, tintAlpha: 0.2 },
};
