/**
 * Đồng hồ của câu đang làm (mm:ss): chạy từ lúc hiện câu, dừng ở thời gian đã ghi khi xem đáp án.
 */
import { useEffect, useState } from 'react';
import { formatDuration } from '@/games/odd-one-out/app/format';
import styles from '@/games/odd-one-out/app/components/PuzzleTimer.module.scss';

interface PuzzleTimerProps {
  startedAt: number;
  /** Đã dừng: thời gian chốt của câu (ms) */
  stoppedMs: number | null;
}

export default function PuzzleTimer({ startedAt, stoppedMs }: PuzzleTimerProps) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (stoppedMs !== null) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [startedAt, stoppedMs]);

  // Câu mới: `now` còn cũ hơn `startedAt` tới nhịp kế tiếp -> 00:00
  const ms = stoppedMs ?? Math.max(0, now - startedAt);
  return (
    <span className={styles.timer} role="timer" aria-label="Puzzle time">
      ⏱ {formatDuration(ms)}
    </span>
  );
}
