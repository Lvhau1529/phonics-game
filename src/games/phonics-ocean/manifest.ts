import type { GameManifest } from '@/core/types/game';

export const phonicsOceanManifest: GameManifest = {
  id: 'phonics-ocean',
  title: 'PHONICS OCEAN',
  tagline: 'Swim, listen and eat the right word-fish to grow big!',
  cover: 'assets/phonics-ocean/cover.png',
  accent: '#20b8a6',
  skills: ['SOUNDS', 'CVC', 'RHYME', 'BLENDS', 'DIGRAPHS', 'MAGIC E'],
  load: () => import('@/games/phonics-ocean/PhonicsOceanGame'),
};
