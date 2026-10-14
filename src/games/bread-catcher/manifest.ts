import type { GameManifest } from '@/core/types/game';

export const breadCatcherManifest: GameManifest = {
  id: 'bread-catcher',
  title: 'BREAD CATCHER',
  tagline: 'Catch the letter breads in order to build each word!',
  cover: 'assets/bread-catcher/cover.png',
  accent: '#ffa62b',
  skills: ['BLENDING', 'SPELLING'],
  load: () => import('@/games/bread-catcher/BreadCatcherGame'),
};
