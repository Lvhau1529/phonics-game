/**
 * Hook React đọc store của Halloween Candy Quest.
 */
import { halloweenStore, type HalloweenState } from '@/games/halloween-candy-quest/session/store';
import { useStore } from '@/core/store/useStore';

export const useHalloween = <S>(selector: (state: HalloweenState) => S): S =>
  useStore(halloweenStore, selector);
