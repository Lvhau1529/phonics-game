/**
 * Nhãn kết quả một câu ở màn xem lại: RIGHT! / ALMOST / TRY AGAIN / TEACHER IS CHECKING (+ điểm).
 */
import clsx from 'clsx';
import Icon from '@/ui/Icon/Icon';
import styles from '@/modules/homework/components/FeedbackBadge/FeedbackBadge.module.scss';

export type Outcome = 'right' | 'almost' | 'wrong' | 'checking';

const TEXT: Record<Outcome, string> = {
  right: 'RIGHT!',
  almost: 'ALMOST!',
  wrong: 'TRY AGAIN',
  checking: 'TEACHER IS CHECKING',
};

interface FeedbackBadgeProps {
  outcome: Outcome;
  score?: number | null;
  maxPoints?: number;
}

export default function FeedbackBadge({ outcome, score, maxPoints }: FeedbackBadgeProps) {
  return (
    <p className={clsx(styles.badge, styles[outcome])} role="status">
      {outcome === 'right' && <Icon name="check" size={22} />}
      {TEXT[outcome]}
      {outcome !== 'checking' && score !== null && score !== undefined && maxPoints !== undefined && (
        <small>
          {score}/{maxPoints}
        </small>
      )}
    </p>
  );
}
