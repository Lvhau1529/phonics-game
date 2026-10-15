/**
 * Ảnh dùng trong màn React (cùng manifest với game — game/config/sprites.json).
 */
import type { Biome } from '@/games/phonics-ocean/content/schema';
import { playerFrame, spriteUrl } from '@/games/phonics-ocean/game/config/sprites';

/** Cá của bé ở một biome (mỗi biome một loài; mặc định cá đỏ rạn san hô) */
export const playerUrl = (biome: Biome = 'coral_reef'): string => spriteUrl(playerFrame(biome, 0)) ?? '';

export const imageUrl = (key: string): string => spriteUrl(key) ?? '';
