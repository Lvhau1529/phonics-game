/**
 * Thanh tiến độ bài: mỗi câu một chấm (đã làm = xanh, đang mở = vàng); bấm chấm để nhảy tới câu.
 */
import clsx from 'clsx';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import styles from '@/platform/homework/components/ProgressBar.module.scss';

interface ProgressBarProps {
  total: number;
  current: number;
  answered: readonly boolean[];
  onJump: (index: number) => void;
}

export default function ProgressBar({ total, current, answered, onJump }: ProgressBarProps) {
  const done = answered.filter(Boolean).length;
  return (
    <div className={styles.bar} role="group" aria-label={`Question ${current + 1} of ${total}`}>
      <ol className={styles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <li key={i}>
            <button
              type="button"
              className={clsx(styles.dot, answered[i] && styles.done, i === current && styles.current)}
              aria-label={`Question ${i + 1}${answered[i] ? ', done' : ''}`}
              aria-current={i === current ? 'step' : undefined}
              onClick={() => {
                playSfx(SFX.UI_TAB);
                onJump(i);
              }}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
      <span className={styles.count}>
        {done}/{total}
      </span>
    </div>
  );
}
