/**
 * Ảnh dùng trong màn React (cùng manifest với game — game/config/sprites.json).
 */
import { playerFrame, spriteUrl } from '@/games/phonics-ocean/game/config/sprites';

/** Cá của bé theo cỡ (1–3); `bite` = khung há miệng */
export const playerUrl = (tier: number, bite = false): string =>
  spriteUrl(bite ? 'player.bite' : playerFrame(tier, 0)) ?? '';

export const imageUrl = (key: string): string => spriteUrl(key) ?? '';
