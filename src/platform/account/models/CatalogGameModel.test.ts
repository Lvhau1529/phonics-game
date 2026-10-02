import { GameCatalogItem } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { CatalogGameModel } from '@/platform/account/models/CatalogGameModel';

const dto: GameCatalogItem = {
  id: 'bread-catcher',
  title: 'Bread Catcher',
  enabled: true,
  comingSoon: false,
  price: 30,
  sortOrder: 1,
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('CatalogGameModel', () => {
  it('isHidden / isFree / manifestPrice', () => {
    const paid = new CatalogGameModel(dto);
    expect(paid.isHidden).toBe(false);
    expect(paid.isFree).toBe(false);
    expect(paid.manifestPrice).toBe(30);

    const free = new CatalogGameModel({ ...dto, enabled: false, price: null });
    expect(free.isHidden).toBe(true);
    expect(free.isFree).toBe(true);
    expect(free.manifestPrice).toBeUndefined();
  });

  it('round-trip cache: toJSON -> GameCatalogItem.parse -> new CatalogGameModel', () => {
    const stored: unknown = JSON.parse(JSON.stringify({ items: [new CatalogGameModel(dto).toJSON()] }));
    const [restored] = (stored as { items: unknown[] }).items.map(
      (item) => new CatalogGameModel(GameCatalogItem.parse(item)),
    );
    expect(restored).toBeInstanceOf(CatalogGameModel);
    expect(restored.toJSON()).toEqual(dto);
    expect(restored.manifestPrice).toBe(30);
  });
});
