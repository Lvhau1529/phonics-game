/**
 * Ảnh dùng trong màn React (cùng manifest với game — game/config/sprites.json).
 */
import type { StreamerId } from '@/games/food-stream/session/types';
import { spriteUrl } from '@/games/food-stream/game/config/sprites';

export type Pose = 'happy' | 'wow' | 'think';

export const streamerUrl = (id: StreamerId, pose: Pose = 'happy'): string =>
  spriteUrl(`character.${id}.${pose}`) ?? '';

export const imageUrl = (key: string | undefined): string | undefined => (key ? spriteUrl(key) : undefined);
