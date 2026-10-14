/**
 * Theme + thông số cảm giác chơi của Food Stream (màu kẹo hồng / xanh như art board).
 */
import { FONTS } from '@/core/phaser/fonts';

export const THEME = {
  fonts: FONTS,
  backgroundColor: '#2b1740',
  colors: {
    ink: '#3a2350',
    white: '#ffffff',
    pink: '#ff6f9c',
    pinkDark: '#d9446f',
    blue: '#3f8cff',
    gold: '#ffd23f',
    green: '#39c16c',
    red: '#ff4d5e',
    purple: '#8a5cf6',
  },
  /** Màu số (0x...) cho Graphics */
  hex: {
    ink: 0x3a2350,
    white: 0xffffff,
    cream: 0xfff8ec,
    pink: 0xff6f9c,
    pinkLight: 0xffd6e2,
    pinkPale: 0xffe9ef,
    gold: 0xffd23f,
    wood: 0xd6966a,
    woodDark: 0xa86a44,
  },
  /** Màu chữ đã điền vào ô (xoay vòng) */
  letterColors: ['#3f8cff', '#39c16c', '#ff6f3c', '#8a5cf6', '#ff4d8d', '#00a6a6'],
  /** Màu tường phòng stream theo gói (xoay vòng) */
  roomWalls: [
    { wall: 0xffd6e2, stripe: 0xffe6ee },
    { wall: 0xd8ecff, stripe: 0xe8f4ff },
    { wall: 0xfff0c8, stripe: 0xfff7e0 },
    { wall: 0xe4dcff, stripe: 0xefeaff },
  ],
} as const;

export const DEPTH = {
  ROOM: 0,
  STREAMER: 10,
  STAGE_FX: 20,
  PANEL: 30,
  CHOICES: 40,
  FLYING: 60,
  HUD: 70,
  BANNER: 80,
  OVERLAY: 100,
} as const;

/** Thời lượng hiệu ứng (ms) */
export const TIMING = {
  countdownStep: 700,
  bannerHold: 900,
  feedFlight: 520,
  biteStep: 230,
  quickBite: 140,
  wrongShake: 420,
  wrongRecover: 700,
  reveal: 1300,
  rewardHold: 700,
  roundCompleteHold: 1800,
  whoGoesFirst: 1600,
} as const;
