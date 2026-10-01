/**
 * Chống nháy màn chờ: `loading` bật thì chờ `delay` ms rồi mới hiện (tải nhanh thì không hiện gì),
 * đã hiện thì giữ ít nhất `minDuration` ms (không loé lên rồi tắt ngay).
 */
import { useEffect, useState } from 'react';

export interface DelayedLoadingOptions {
  /** Chờ bao lâu rồi mới hiện (ms) */
  delay?: number;
  /** Đã hiện thì giữ tối thiểu bao lâu (ms) */
  minDuration?: number;
}

export function useDelayedLoading(
  loading: boolean,
  { delay = 200, minDuration = 400 }: DelayedLoadingOptions = {},
): boolean {
  // Lúc hiện (ms theo Date.now) — null = đang ẩn
  const [shownAt, setShownAt] = useState<number | null>(null);

  useEffect(() => {
    if (loading) {
      if (shownAt !== null) return undefined;
      const timer = window.setTimeout(() => setShownAt(Date.now()), delay);
      return () => window.clearTimeout(timer);
    }
    if (shownAt === null) return undefined;
    // Ẩn khi đã đủ minDuration (tối thiểu một nhịp để không setState ngay trong effect)
    const remaining = Math.max(0, shownAt + minDuration - Date.now());
    const timer = window.setTimeout(() => setShownAt(null), remaining);
    return () => window.clearTimeout(timer);
  }, [loading, shownAt, delay, minDuration]);

  return shownAt !== null;
}
