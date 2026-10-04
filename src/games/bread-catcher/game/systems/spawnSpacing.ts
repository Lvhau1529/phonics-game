/**
 * Chọn chỗ rơi cho bánh mới sao cho không lọt chung "cửa hứng" với bánh khác tới miệng rổ gần cùng lúc
 * (hàm thuần — LetterSpawnSystem lo phần lọc đối thủ theo thời điểm tới rổ).
 *
 * Một vị trí rổ hứng được cả hai bánh khi |Δx| < vùng hứng + (hitbox bánh này + hitbox bánh kia) / 2;
 * hai bánh cỡ gần nhau nên đòi Δx ≥ vùng hứng + hitbox đối thủ + margin.
 */
export interface SpawnRival {
  x: number;
  /** Bề rộng hitbox (đã nhân scale) */
  width: number;
}

export interface SpawnSpacing {
  min: number;
  max: number;
  rivals: readonly SpawnRival[];
  /** Bề rộng vùng hứng của rổ (đã nhân scale) */
  catchWidth: number;
  margin: number;
  /** Phần tử ngẫu nhiên của mảng (thay được trong test) */
  pick: <T>(items: readonly T[]) => T;
}

/** Khoảng dư so với khoảng cách tối thiểu tới đối thủ gần nhất (âm = lọt chung cửa hứng) */
export function spacingSlack(x: number, { rivals, catchWidth, margin }: SpawnSpacing): number {
  return Math.min(
    Infinity,
    ...rivals.map((rival) => Math.abs(x - rival.x) - (catchWidth + rival.width + margin)),
  );
}

/**
 * Duyệt mọi x nguyên trong [min, max] (vài trăm giá trị): chọn ngẫu nhiên một vị trí đủ xa mọi đối thủ;
 * không có (đối thủ chặn kín) thì chọn ngẫu nhiên trong các vị trí ít vi phạm nhất.
 */
export function pickSpawnX(spacing: SpawnSpacing): number {
  const min = Math.ceil(spacing.min);
  const max = Math.max(min, Math.floor(spacing.max));
  const slacks = Array.from({ length: max - min + 1 }, (_, index) => spacingSlack(min + index, spacing));
  const best = Math.max(...slacks);
  const threshold = best >= 0 ? 0 : best;
  const candidates = slacks.flatMap((slack, index) => (slack >= threshold ? [min + index] : []));
  return spacing.pick(candidates);
}
