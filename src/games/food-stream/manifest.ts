import type { GameManifest } from '@/core/types/game';

export const foodStreamManifest: GameManifest = {
  id: 'food-stream',
  title: 'FOOD STREAM',
  tagline: 'Go live! Listen, then feed the streamer the right letter food.',
  cover: 'assets/food-stream/cover.png',
  accent: '#ff6f9c',
  skills: ['SOUNDS', 'FIRST LETTER', 'CVC WORDS'],
  load: () => import('@/games/food-stream/FoodStreamGame'),
};
