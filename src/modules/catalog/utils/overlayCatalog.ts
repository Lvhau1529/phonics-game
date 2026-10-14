/** Phủ catalog server lên manifest của app (hàm thuần): ẩn game tắt, COMING SOON, giá, thứ tự server */
import type { CatalogGameModel } from '@/modules/catalog/models/CatalogGameModel';
import type { GameManifest, UpcomingGame } from '@/core/types/game';

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
