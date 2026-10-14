import type { GameCatalogItem, GameId } from '@phonics/contracts';

/**
 * Một game trong catalog server (từ `GameCatalogItem` của BE, GET /public/games) — phủ lên manifest ở màn chọn game.
 * Field giữ nguyên tên như contracts; getter là dữ liệu chỉ phía FE dùng. Cache localStorage bằng `toJSON()`,
 * đọc lại: `GameCatalogItem.safeParse` rồi `new CatalogGameModel(...)`.
 */
export class CatalogGameModel {
  readonly id: GameId;
  readonly title: string;
  /** false = ẩn khỏi màn chọn game (bảo trì) */
  readonly enabled: boolean;
  /** true = thẻ COMING SOON, không mở được */
  readonly comingSoon: boolean;
  /** Số kim cương để mở khoá; null = miễn phí */
  readonly price: number | null;
  readonly sortOrder: number;
  readonly updatedAt: string;

  constructor(data: GameCatalogItem) {
    this.id = data.id;
    this.title = data.title;
    this.enabled = data.enabled;
    this.comingSoon = data.comingSoon;
    this.price = data.price;
    this.sortOrder = data.sortOrder;
    this.updatedAt = data.updatedAt;
  }

  get isHidden(): boolean {
    return !this.enabled;
  }

  get isFree(): boolean {
    return this.price === null;
  }

  /** Giá theo kiểu `GameManifest.price` (undefined = miễn phí) */
  get manifestPrice(): number | undefined {
    return this.price ?? undefined;
  }

  /** DTO đúng như BE (cache localStorage) */
  toJSON(): GameCatalogItem {
    return {
      id: this.id,
      title: this.title,
      enabled: this.enabled,
      comingSoon: this.comingSoon,
      price: this.price,
      sortOrder: this.sortOrder,
      updatedAt: this.updatedAt,
    };
  }
}
