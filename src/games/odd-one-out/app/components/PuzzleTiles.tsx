/**
 * 4 ô hình của câu đố (A–D). Bước choose / speak: chạm để chọn (máy đọc tên hình);
 * bước answer: ô đúng xanh lá, ô bé chọn sai đỏ, các ô khoá lại.
 * Máy tính: phím 1–4 hoặc A–D để chọn.
 */
import { useEffect } from 'react';
import clsx from 'clsx';
import OptionArt from '@/games/odd-one-out/app/components/OptionArt';
import type { RoundPuzzle } from '@/games/odd-one-out/session/types';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import styles from '@/games/odd-one-out/app/components/PuzzleTiles.module.scss';

const LETTERS = ['A', 'B', 'C', 'D'];

interface PuzzleTilesProps {
  current: RoundPuzzle;
  selected: number | null;
  revealed: boolean;
  /** Ô nhỏ hơn (bước nói / đáp án) để khung bên dưới vừa màn hình điện thoại */
  compact?: boolean;
  onChoose: (index: number) => void;
}

export default function PuzzleTiles({
  current,
  selected,
  revealed,
  compact = false,
  onChoose,
}: PuzzleTilesProps) {
  useEffect(() => {
    if (revealed) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const key = event.key.toUpperCase();
      const digit = ['1', '2', '3', '4'].indexOf(key);
      const index = digit >= 0 ? digit : LETTERS.indexOf(key);
      if (index >= 0 && index < current.options.length) onChoose(index);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, revealed, onChoose]);

  return (
    <div className={clsx(styles.tiles, compact && styles.compact)} role="group" aria-label="Pictures">
      {current.options.map((option, index) => {
        const isOdd = index === current.odd;
        const isSelected = index === selected;
        return (
          <button
            key={option.name}
            type="button"
            className={clsx(
              styles.tile,
              !revealed && isSelected && styles.selected,
              revealed && isOdd && styles.correct,
              revealed && isSelected && !isOdd && styles.wrong,
              revealed && !isOdd && !isSelected && styles.dim,
            )}
            disabled={revealed}
            aria-pressed={isSelected}
            aria-label={`${LETTERS[index]}: ${option.name}`}
            onClick={() => {
              playSfx(SFX.UI_CLICK);
              onChoose(index);
            }}
          >
            <span className={styles.letter}>{LETTERS[index]}</span>
            <OptionArt option={option} className={styles.art} />
            <span className={styles.name}>{option.name}</span>
          </button>
        );
      })}
    </div>
  );
}
