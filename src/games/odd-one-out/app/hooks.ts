/**
 * Hook React đọc store của Odd One Out.
 */
import type { BoardRecord } from '@/games/odd-one-out/session/leaderboard';
import { boardStore } from '@/games/odd-one-out/session/storage';
import { oddOneOutStore, type OddOneOutState } from '@/games/odd-one-out/session/store';
import { useStore } from '@/core/store/useStore';

export const useOddOneOut = <S>(selector: (state: OddOneOutState) => S): S =>
  useStore(oddOneOutStore, selector);

export const useBoard = (): BoardRecord[] => useStore(boardStore, (state) => state.records);
