/**
 * Hình của một lựa chọn: emoji, hoặc hình vẽ CSS (chấm màu / chữ nhật / bầu dục) khi không có emoji phù hợp.
 */
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import type { PuzzleOption } from '@/games/odd-one-out/content/puzzles';
import styles from '@/games/odd-one-out/app/components/OptionArt.module.scss';

interface OptionArtProps {
  option: PuzzleOption;
  className?: string;
}

export default function OptionArt({ option, className }: OptionArtProps) {
  if (option.emoji) {
    return (
      <span className={clsx(styles.emoji, className)} aria-hidden="true">
        {option.emoji}
      </span>
    );
  }
  const style = option.color ? ({ '--shape-color': option.color } as CSSProperties) : undefined;
  return (
    <span className={clsx(styles.shapeBox, className)} aria-hidden="true">
      <span className={clsx(styles.shape, option.shape && styles[option.shape])} style={style} />
    </span>
  );
}
