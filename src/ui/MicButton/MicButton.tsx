/**
 * Nút micro "bé nói, máy nghe" dùng chung cho các game luyện nói (core/hooks/useSpeechListener).
 * Đang nghe: nút đỏ nhấp nháy, bấm lần nữa để dừng. Trình duyệt không hỗ trợ thì game không hiện nút này.
 */
import clsx from 'clsx';
import type { ListenStatus } from '@/core/hooks/useSpeechListener';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import styles from '@/ui/MicButton/MicButton.module.scss';

interface MicButtonProps {
  status: ListenStatus;
  onStart: () => void;
  onStop: () => void;
  labels: { start: string; listening: string; again: string };
  className?: string;
}

export default function MicButton({ status, onStart, onStop, labels, className }: MicButtonProps) {
  const listening = status === 'listening';
  const label = listening ? labels.listening : status === 'idle' ? labels.start : labels.again;
  return (
    <button
      type="button"
      className={clsx(styles.mic, listening && styles.listening, className)}
      aria-pressed={listening}
      onClick={() => {
        playSfx(listening ? SFX.UI_TOGGLE_OFF : SFX.UI_TOGGLE_ON);
        if (listening) onStop();
        else onStart();
      }}
    >
      <span className={styles.icon} aria-hidden="true">
        🎙️
      </span>
      {label}
    </button>
  );
}
