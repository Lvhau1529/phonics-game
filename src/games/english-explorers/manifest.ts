import type { GameManifest } from '@/core/types/game';

export const englishExplorersManifest: GameManifest = {
  id: 'english-explorers',
  title: 'LITTLE ENGLISH EXPLORERS',
  tagline: 'Visit magic animal worlds and say whole English sentences!',
  cover: 'assets/english-explorers/cover.png',
  accent: '#13b764',
  skills: ['SENTENCES', 'SPEAKING'],
  load: () => import('@/games/english-explorers/EnglishExplorersGame'),
};
