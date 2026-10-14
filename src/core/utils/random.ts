/** Bản sao đã xáo trộn (Fisher–Yates) */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) throw new Error('pickRandom: empty list');
  return items[Math.floor(Math.random() * items.length)];
}

/** Chọn một key theo trọng số: { a: 3, b: 1 } -> "a" với xác suất 75% */
export function pickWeighted<K extends string>(weights: Partial<Record<K, number>>): K {
  const entries = (Object.entries(weights) as [K, number][]).filter(([, w]) => w > 0);
  if (entries.length === 0) throw new Error('pickWeighted: no positive weights');

  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0];
}
