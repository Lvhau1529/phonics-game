/**
 * Service game: gọi `gamesRepository` rồi đổi DTO → model (`CatalogGameModel`, `StudentGameModel`).
 * Store / màn hình chỉ gọi service, không gọi repository trực tiếp.
 */
import { gamesRepository } from '@/platform/account/api/gamesRepository';
import { CatalogGameModel } from '@/platform/account/models/CatalogGameModel';
import { StudentGameModel } from '@/platform/account/models/StudentGameModel';

export const gamesService = {
  /** Catalog server (GET /public/games) */
  catalog: async () => (await gamesRepository.catalog()).items.map((item) => new CatalogGameModel(item)),
  /** Trạng thái game của học sinh đang đăng nhập (GET /me/games) */
  mine: async () => (await gamesRepository.mine()).items.map((item) => new StudentGameModel(item)),
  /** Ghi nhận mở khoá bằng kim cương (ack, idempotent, không có body trả về) */
  unlockWithGems: (gameId: string, gemsSpent: number) =>
    gamesRepository.unlockWithGems(gameId, { gemsSpent }),
};
