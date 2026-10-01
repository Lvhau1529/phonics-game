/**
 * Đầu màn React (Setup...): nút quay lại + tiêu đề (+ tuỳ chọn phần tử ở cuối, vd chấm "đang tải lại").
 */
import type { ReactNode } from 'react';
import BackButton from '@/platform/ui/BackButton';
import styles from '@/platform/ui/ScreenHeader.module.scss';

interface ScreenHeaderProps {
  title: string;
  backLabel: string;
  onBack: () => void;
  /** Góc phải header (chấm đang tải lại...) */
  trailing?: ReactNode;
}

export default function ScreenHeader({ title, backLabel, onBack, trailing }: ScreenHeaderProps) {
  return (
    <header className={styles.header}>
      <BackButton label={backLabel} onClick={onBack} />
      <h1>{title}</h1>
      {trailing && <span className={styles.trailing}>{trailing}</span>}
    </header>
  );
}
