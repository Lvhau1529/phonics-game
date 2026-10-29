import type { GameManifest } from '@/core/types/game';

export const halloweenCandyQuestManifest: GameManifest = {
  id: 'halloween-candy-quest',
  title: 'HALLOWEEN CANDY QUEST',
  tagline: 'Knock on doors, find the words and fill your candy basket!',
  cover: 'assets/halloween-candy-quest/cover.png',
  accent: '#f07a1a',
  skills: ['VOCABULARY', 'LISTENING'],
  load: () => import('@/games/halloween-candy-quest/HalloweenCandyQuestGame'),
};
