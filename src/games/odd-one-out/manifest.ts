import type { GameManifest } from '@/core/types/game';

export const oddOneOutManifest: GameManifest = {
  id: 'odd-one-out',
  title: 'ODD ONE OUT',
  tagline: 'Find the picture that is different, then say why in English!',
  cover: 'assets/odd-one-out/cover.png',
  accent: '#56b6fa',
  skills: ['VOCABULARY', 'SPEAKING'],
  load: () => import('@/games/odd-one-out/OddOneOutGame'),
};
