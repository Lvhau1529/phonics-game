/**
 * Catalog game từ server phủ lên manifest + trạng thái mở khoá của học sinh:
 *   - GET /public/games (cache `phonics-arcade:catalog` = DTO, đọc lại thành `CatalogGameModel`):
 *     `enabled=false` ẩn thẻ, `comingSoon` thành thẻ COMING SOON, `price` (null = miễn phí) ghi đè
 *     `manifest.price`. Không có API / chưa tải được -> manifest.
 *   - Đã đăng nhập: GET /me/games -> game server đã mở (admin / GV mở, hoặc đã ghi nhận mở bằng kim cương).
 *     `isUnlocked(game)` = server mở ∪ ví kim cương trên máy (platform/gems/wallet.ts).
 *   - Mở khoá bằng kim cương khi đang đăng nhập -> trừ ví như cũ + xếp hàng POST /me/games/:id/unlock
 *     (`phonics-arcade:unlock-queue`, idempotent, gửi lại như điểm).
 */
import { GameCatalogItem } from '@phonics/contracts';
import { useMemo } from 'react';
import { gamesService } from '@/platform/account/api/gamesService';
import { authStore, isSignedIn } from '@/platform/account/authStore';
import { ACCOUNT_ENABLED } from '@/platform/account/config';
import { CatalogGameModel } from '@/platform/account/models/CatalogGameModel';
import type { StudentGameModel } from '@/platform/account/models/StudentGameModel';
import { createSyncQueue } from '@/platform/account/syncQueue';
import {
  isUnlocked as walletUnlocked,
  unlockGame,
  walletStore,
  type WalletState,
} from '@/platform/gems/wallet';
import { useStore } from '@/platform/hooks/useStore';
import { readJson, writeJson } from '@/platform/storage';
import type { GameManifest, UpcomingGame } from '@/platform/types';
import { createStore } from '@/shared/createStore';

export const CATALOG_KEY = 'phonics-arcade:catalog';
export const UNLOCK_QUEUE_KEY = 'phonics-arcade:unlock-queue';

export interface CatalogState {
  /** null = chưa tải được lần nào -> dùng manifest */
  items: CatalogGameModel[] | null;
  /** Trạng thái game của học sinh đang đăng nhập (null = khách / chưa tải) */
  mine: StudentGameModel[] | null;
}

function loadCatalog(): CatalogGameModel[] | null {
  const stored = readJson<{ items: unknown[] }>(CATALOG_KEY);
  if (!Array.isArray(stored?.items)) return null;
  return stored.items
    .map((item) => GameCatalogItem.safeParse(item))
    .filter((result) => result.success)
    .map((result) => new CatalogGameModel(result.data));
}

export const catalogStore = createStore<CatalogState>({
  items: ACCOUNT_ENABLED ? loadCatalog() : null,
  mine: null,
});

interface QueuedUnlock {
  userId: string;
  gameId: string;
  gemsSpent: number;
}

const unlockQueue = createSyncQueue<QueuedUnlock>({
  key: UNLOCK_QUEUE_KEY,
  sanitize(item) {
    const value = item as Partial<QueuedUnlock> | null;
    if (!value || typeof value.userId !== 'string' || typeof value.gameId !== 'string') return null;
    return {
      userId: value.userId,
      gameId: value.gameId,
      gemsSpent: Math.max(0, Number(value.gemsSpent) || 0),
    };
  },
  canSend: (item) => item.userId === authStore.get().user?.id,
  send: (item) => gamesService.unlockWithGems(item.gameId, item.gemsSpent),
  onSent: () => void gamesSync.refreshMine(),
});

export const gamesSync = {
  async refreshCatalog(): Promise<void> {
    if (!ACCOUNT_ENABLED) return;
    try {
      const items = await gamesService.catalog();
      catalogStore.set((state) => ({ ...state, items }));
      writeJson(CATALOG_KEY, { items: items.map((item) => item.toJSON()) });
    } catch {
      // Giữ bản cache / manifest
    }
  },

  async refreshMine(): Promise<void> {
    if (!ACCOUNT_ENABLED || !isSignedIn()) return;
    try {
      const mine = await gamesService.mine();
      catalogStore.set((state) => ({ ...state, mine }));
    } catch {
      // Lần sau
    }
  },

  init(): void {
    if (!ACCOUNT_ENABLED) return;
    const sync = () => {
      void gamesSync.refreshCatalog();
      void gamesSync.refreshMine();
      void unlockQueue.flush();
    };
    let wasSignedIn = isSignedIn();
    authStore.subscribe(() => {
      const now = isSignedIn();
      if (now !== wasSignedIn) {
        wasSignedIn = now;
        if (now) sync();
        else catalogStore.set((state) => ({ ...state, mine: null }));
      }
    });
    window.addEventListener('online', sync);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') sync();
    });
    sync();
  },
};

// ---------------------------------------------------------------------------
// Mở khoá
// ---------------------------------------------------------------------------
const serverUnlockedIds = (state: CatalogState): readonly string[] =>
  state.mine?.filter((item) => item.unlocked).map((item) => item.gameId) ?? [];

export function isUnlocked(
  game: GameManifest,
  wallet: WalletState = walletStore.get(),
  catalog: CatalogState = catalogStore.get(),
): boolean {
  return walletUnlocked(game, wallet) || serverUnlockedIds(catalog).includes(game.id);
}

/** Trừ kim cương + mở khoá trên máy; đang đăng nhập thì báo server (xếp hàng). false nếu không đủ */
export function unlockWithGems(game: GameManifest): boolean {
  const alreadyUnlocked = isUnlocked(game);
  if (!unlockGame(game)) return false;
  const { user } = authStore.get();
  if (ACCOUNT_ENABLED && !alreadyUnlocked && isSignedIn() && user) {
    unlockQueue.push({ userId: user.id, gameId: game.id, gemsSpent: game.price ?? 0 });
    void unlockQueue.flush();
  }
  return true;
}

// ---------------------------------------------------------------------------
// Phủ catalog lên manifest
// ---------------------------------------------------------------------------
export interface Catalog {
  games: readonly GameManifest[];
  upcoming: readonly UpcomingGame[];
  isUnlocked: (game: GameManifest) => boolean;
}

export function overlayCatalog(
  games: readonly GameManifest[],
  upcoming: readonly UpcomingGame[],
  items: readonly CatalogGameModel[] | null,
): { games: GameManifest[]; upcoming: UpcomingGame[] } {
  if (!items) return { games: [...games], upcoming: [...upcoming] };
  const byId = new Map(items.map((item) => [item.id as string, item]));
  const visible: GameManifest[] = [];
  const soon: UpcomingGame[] = [];
  games.forEach((game) => {
    const item = byId.get(game.id);
    if (!item) {
      visible.push(game);
      return;
    }
    if (item.isHidden) return;
    if (item.comingSoon) {
      soon.push({ id: game.id, title: game.title, tagline: game.tagline });
      return;
    }
    const price = item.manifestPrice;
    visible.push(price === game.price ? game : { ...game, price });
  });
  // Thứ tự server (sortOrder); game không có trong catalog giữ nguyên thứ tự manifest ở cuối
  const order = (game: GameManifest) => byId.get(game.id)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
  visible.sort((a, b) => order(a) - order(b));
  return { games: visible, upcoming: [...soon, ...upcoming] };
}

/** Danh sách game ở màn chọn game sau khi phủ catalog server (ổn định tham chiếu giữa các lần render) */
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
