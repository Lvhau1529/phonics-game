import { describe, expect, it } from 'vitest';
import { pickSpawnX, spacingSlack, type SpawnSpacing } from '@/games/bread-catcher/game/systems/spawnSpacing';
import { pickRandom } from '@/shared/random';

/** Màn dọc: x trong [40, 320], vùng hứng 62 (78 × 0.8), hitbox bánh ~46 -> cửa hứng 114 */
const base = (overrides: Partial<SpawnSpacing> = {}): SpawnSpacing => ({
  min: 40,
  max: 320,
  rivals: [],
  catchWidth: 62,
  margin: 6,
  pick: pickRandom,
  ...overrides,
});

describe('pickSpawnX', () => {
  it('không có đối thủ: vị trí bất kỳ trong khoảng', () => {
    const x = pickSpawnX(base());
    expect(x).toBeGreaterThanOrEqual(40);
    expect(x).toBeLessThanOrEqual(320);
  });

  it('luôn cách bánh tới rổ cùng lúc ít nhất một cửa hứng (màn dọc 360)', () => {
    for (let rivalX = 40; rivalX <= 320; rivalX += 1) {
      const x = pickSpawnX(base({ rivals: [{ x: rivalX, width: 46 }] }));
      expect(Math.abs(x - rivalX)).toBeGreaterThanOrEqual(114);
      expect(x).toBeGreaterThanOrEqual(40);
      expect(x).toBeLessThanOrEqual(320);
    }
  });

  it('chỉ chọn trong các vị trí hợp lệ', () => {
    const spacing = base({ rivals: [{ x: 180, width: 46 }], pick: (items) => items[items.length - 1] });
    expect(pickSpawnX(spacing)).toBe(320);
    expect(pickSpawnX({ ...spacing, pick: (items) => items[0] })).toBe(40);
    // 40..66 và 294..320 — đúng hai đầu cách 180 đủ 114
    expect(pickSpawnX({ ...spacing, pick: (items) => items[26] })).toBe(66);
    expect(pickSpawnX({ ...spacing, pick: (items) => items[27] })).toBe(294);
  });

  it('đối thủ chặn kín: lấy vị trí ít vi phạm nhất', () => {
    const spacing = base({
      rivals: [
        { x: 100, width: 46 },
        { x: 260, width: 46 },
      ],
    });
    // Giữa hai đối thủ (x = 180) cách mỗi bên 80 -> thiếu 34, tốt hơn mọi chỗ khác
    expect(pickSpawnX(spacing)).toBe(180);
    expect(spacingSlack(180, spacing)).toBe(80 - 114);
  });
});
