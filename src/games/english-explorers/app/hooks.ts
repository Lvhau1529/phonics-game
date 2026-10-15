/**
 * Hook React đọc store của Little English Explorers.
 */
import { progressStore, type WorldProgress } from '@/games/english-explorers/session/storage';
import { englishExplorersStore, type EnglishExplorersState } from '@/games/english-explorers/session/store';
import { useStore } from '@/core/store/useStore';

export const useExplorers = <S>(selector: (state: EnglishExplorersState) => S): S =>
  useStore(englishExplorersStore, selector);

export const useProgress = (): Record<string, WorldProgress> =>
  useStore(progressStore, (state) => state.progress);
