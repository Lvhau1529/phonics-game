/**
 * Bàn phím a–z trên màn hình (bé gõ chữ vào ô đang chọn) + ⌫ + DONE. Không dùng <input> để tránh bàn phím
 * hệ điều hành che màn. Phím vật lý (máy tính lớp) cũng hoạt động khi bàn phím đang hiện.
 */
import { useEffect } from 'react';
import clsx from 'clsx';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import styles from '@/modules/homework/components/OnScreenKeyboard/OnScreenKeyboard.module.scss';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

interface OnScreenKeyboardProps {
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onDone?: () => void;
  /** Chỉ cho gõ các chữ này (vd các chữ trong từ đã xáo) */
  allowed?: readonly string[];
  className?: string;
}

export default function OnScreenKeyboard({
  onLetter,
  onBackspace,
  onDone,
  allowed,
  className,
}: OnScreenKeyboardProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Backspace') {
        event.preventDefault();
        onBackspace();
      } else if (event.key === 'Enter') {
        onDone?.();
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        const letter = event.key.toLowerCase();
        if (!allowed || allowed.includes(letter)) onLetter(letter);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onLetter, onBackspace, onDone, allowed]);

  return (
    <div className={clsx(styles.keyboard, className)} role="group" aria-label="Keyboard">
      {ROWS.map((row) => (
        <div key={row} className={styles.row}>
          {row.split('').map((letter) => (
            <button
              key={letter}
              type="button"
              className={styles.key}
              disabled={allowed ? !allowed.includes(letter) : false}
              onClick={() => {
                playSfx(SFX.UI_CLICK);
                onLetter(letter);
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      ))}
      <div className={styles.row}>
        <button
          type="button"
          className={clsx(styles.key, styles.wide, styles.backspace)}
          aria-label="Delete"
          onClick={() => {
            playSfx(SFX.UI_BACK);
            onBackspace();
          }}
        >
          ⌫
        </button>
        {onDone && (
          <button
            type="button"
            className={clsx(styles.key, styles.wide, styles.done)}
            onClick={() => {
              playSfx(SFX.UI_START);
              onDone();
            }}
          >
            DONE
          </button>
        )}
      </div>
    </div>
  );
}
