/**
 * Thẻ trong phần HƯỚNG DẪN (chế độ chơi, gói từ, cấp độ...). Đặt các thẻ trong <div className={guide.cards}>.
 * `accent`: màu mép trái (vd theo cấp độ); bỏ trống = màu viền thường.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { ToneColor } from '@/ui/tone';
import guide from '@/ui/guide/guideContent.module.scss';

interface GuideCardProps {
  accent?: ToneColor;
  children: ReactNode;
}

export default function GuideCard({ accent, children }: GuideCardProps) {
  const style = accent ? ({ '--guide-card-accent': `var(--color-${accent})` } as CSSProperties) : undefined;
  return (
    <article className={guide.card} style={style}>
      {children}
    </article>
  );
}
