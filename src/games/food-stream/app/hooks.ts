/**
 * Hook React đọc store của Food Stream.
 */
import { foodStreamStore, type FoodStreamState } from '@/games/food-stream/session/store';
import { progressStore, type LevelProgress } from '@/games/food-stream/session/storage';
import { useStore } from '@/core/store/useStore';

export const useFoodStream = <S>(selector: (state: FoodStreamState) => S): S =>
  useStore(foodStreamStore, selector);

export const useProgress = (): Record<string, LevelProgress> =>
  useStore(progressStore, (state) => state.progress);
