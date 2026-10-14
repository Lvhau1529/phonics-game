/**
 * Nút loa: phát file audio của phiếu (theo mediaId) hoặc đọc chữ bằng Web Speech khi không có file.
 * Đang phát thì nút nhún; bấm lại để dừng.
 */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useMedia } from '@/platform/homework/components/mediaContext';
import { usePrefs } from '@/platform/hooks/useStore';
import Icon from '@/platform/ui/Icon';
import { speech } from '@/shared/speech';
import styles from '@/platform/homework/components/AudioButton.module.scss';

interface AudioButtonProps {
  /** File audio (ưu tiên) */
  mediaId?: string | null;
  /** Chữ đọc bằng TTS khi không có file */
  text?: string;
  label?: string;
  size?: 'md' | 'lg';
  className?: string;
}

export default function AudioButton({
  mediaId,
  text,
  label = 'Listen',
  size = 'md',
  className,
}: AudioButtonProps) {
  const media = useMedia(mediaId);
  const prefs = usePrefs();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const src = media?.url;

  const stop = () => {
    audio.current?.pause();
    speech.cancel();
    setPlaying(false);
  };

  const play = () => {
    if (playing) return stop();
    if (src) {
      const el = audio.current ?? new Audio();
      audio.current = el;
      el.src = src;
      el.onended = () => setPlaying(false);
      el.onerror = () => setPlaying(false);
      setPlaying(true);
      void el.play().catch(() => setPlaying(false));
    } else if (text && prefs.voice) {
      setPlaying(true);
      speech.say(text, { onEnd: () => setPlaying(false) });
    }
  };

  // Rời màn / đổi nguồn: dừng phát
  useEffect(() => stop, [src, text]);

  if (!src && !text) return null;
  return (
    <button
      type="button"
      className={clsx(styles.audio, size === 'lg' && styles.lg, playing && styles.playing, className)}
      aria-label={label}
      aria-pressed={playing}
      onClick={play}
    >
      <Icon name="voiceOn" size={size === 'lg' ? 34 : 26} />
    </button>
  );
}
