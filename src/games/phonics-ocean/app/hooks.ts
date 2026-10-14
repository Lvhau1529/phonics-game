/**
 * Hook React đọc store của Phonics Ocean.
 */
import { phonicsOceanStore, type PhonicsOceanState } from '@/games/phonics-ocean/session/store';
import { progressStore, type LevelProgress } from '@/games/phonics-ocean/session/storage';
import { useStore } from '@/core/store/useStore';

export const usePhonicsOcean = <S>(selector: (state: PhonicsOceanState) => S): S =>
  useStore(phonicsOceanStore, selector);

export const useProgress = (): Record<string, LevelProgress> =>
  useStore(progressStore, (state) => state.progress);
