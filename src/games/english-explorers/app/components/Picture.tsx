/**
 * Tranh của câu hỏi / đáp án: ảnh (public/assets/english-explorers/pictures) hoặc emoji.
 */
import clsx from 'clsx';
import { pictureUrl } from '@/games/english-explorers/app/assets';
import type { PictureName } from '@/games/english-explorers/content/worlds';
import styles from '@/games/english-explorers/app/components/Picture.module.scss';

interface PictureProps {
  image?: PictureName;
  emoji?: string;
  /** Mô tả cho trình đọc màn hình; bỏ trống = trang trí */
  alt?: string;
  className?: string;
}

export default function Picture({ image, emoji, alt = '', className }: PictureProps) {
  if (image) return <img className={clsx(styles.image, className)} src={pictureUrl(image)} alt={alt} />;
  if (!emoji) return null;
  return (
    <span
      className={clsx(styles.emoji, className)}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {emoji}
    </span>
  );
}
