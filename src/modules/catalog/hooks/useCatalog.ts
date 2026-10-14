/** Danh sách game ở màn chọn game sau khi phủ catalog server (ổn định tham chiếu giữa các lần render) */
import { useMemo } from 'react';
import { catalogStore, isUnlocked } from '@/modules/catalog/stores/catalogStore';
import { overlayCatalog } from '@/modules/catalog/utils/overlayCatalog';
import { walletStore } from '@/modules/gems';
import { useStore } from '@/core/store/useStore';
import type { GameManifest, UpcomingGame } from '@/core/types/game';

export interface Catalog {
  games: readonly GameManifest[];
  upcoming: readonly UpcomingGame[];
  isUnlocked: (game: GameManifest) => boolean;
}

export function useCatalog(games: readonly GameManifest[], upcoming: readonly UpcomingGame[]): Catalog {
  const items = useStore(catalogStore, (state) => state.items);
  const mine = useStore(catalogStore, (state) => state.mine);
  const wallet = useStore(walletStore, (state) => state);
  return useMemo(() => {
    const overlaid = overlayCatalog(games, upcoming, items);
    return {
      ...overlaid,
      isUnlocked: (game: GameManifest) => isUnlocked(game, wallet, { items, mine }),
    };
  }, [games, upcoming, items, mine, wallet]);
}
