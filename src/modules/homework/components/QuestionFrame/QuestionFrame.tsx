/**
 * Khung một câu: số thứ tự + hướng dẫn (có nút loa đọc hướng dẫn) + ví dụ "E.g." + nội dung (renderer).
 */
import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import type { QuestionExample } from '@phonics/contracts';
import AudioButton from '@/modules/homework/components/AudioButton/AudioButton';
import { useMedia } from '@/modules/homework/renderers/mediaContext';
import { usePrefs } from '@/core/store/useStore';
import { speech } from '@/core/utils/speech';
import styles from '@/modules/homework/components/QuestionFrame/QuestionFrame.module.scss';

interface QuestionFrameProps {
  number: number;
  instruction: string;
  example?: QuestionExample | null;
  /** Tự đọc hướng dẫn khi hiện câu (màn làm bài) */
  speak?: boolean;
  /** Mép trái theo kết quả (màn xem lại) */
  tone?: 'right' | 'almost' | 'wrong' | 'checking';
  children: ReactNode;
}

export default function QuestionFrame({
  number,
  instruction,
  example,
  speak,
  tone,
  children,
}: QuestionFrameProps) {
  const exampleImage = useMedia(example?.imageMediaId);
  const voice = usePrefs().voice;
  // Hiện câu mới: đọc hướng dẫn (VOICE bật); rời câu thì dừng
  useEffect(() => {
    if (!speak || !voice) return undefined;
    speech.say(instruction);
    return () => speech.cancel();
  }, [speak, voice, instruction]);
  return (
    <section className={clsx(styles.frame, tone && styles[tone])}>
      <header className={styles.head}>
        <span className={styles.number}>{number}</span>
        <p className={styles.instruction}>{instruction}</p>
        <AudioButton text={instruction} label="Read the instruction" />
      </header>
      {example && (
        <p className={styles.example}>
          <b>E.g.</b> {exampleImage && <img src={exampleImage.url} alt="" />} {example.text}
        </p>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
