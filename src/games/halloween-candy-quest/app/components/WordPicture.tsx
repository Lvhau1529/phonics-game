/**
 * Ảnh của một từ: icon pixel-art của thư viện (phóng to nearest-neighbor) hoặc ảnh giáo viên upload (làm mượt).
 */
import clsx from 'clsx';
import type { VocabWord } from '@/games/halloween-candy-quest/content/words';
import styles from '@/games/halloween-candy-quest/app/components/WordPicture.module.scss';

interface WordPictureProps {
  word: VocabWord;
  className?: string;
  /** Hiện chữ làm alt (mặc định ẩn với trình đọc màn hình để không lộ đáp án qua chữ) */
  alt?: string;
}

export default function WordPicture({ word, className, alt = '' }: WordPictureProps) {
  return (
    <img
      src={word.image}
      alt={alt}
      draggable={false}
      className={clsx(styles.picture, !word.custom && styles.pixel, className)}
    />
  );
}
