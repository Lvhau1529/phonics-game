/** 75000 -> "01:15" */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** 0.8 -> "80%" */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** 1234 -> "1.2K", 25000 -> "25K" */
export function compactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}
