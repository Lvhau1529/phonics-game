/**
 * Nhân vật pixel-art từ spritesheet 2 frame × 5 tư thế (assets.ts > characterSheetUrl): đổi frame bằng CSS steps,
 * phóng to nearest-neighbor. `size` tính bằng px của phần tử chứa (trong sân khấu là px thế giới).
 */
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { characterSheetUrl } from '@/games/halloween-candy-quest/app/assets';
import { POSES, type Pose } from '@/games/halloween-candy-quest/content/world';
import styles from '@/games/halloween-candy-quest/app/components/CharacterSprite.module.scss';

interface CharacterSpriteProps {
  id: string;
  pose?: Pose;
  size: number;
  /** Quay mặt sang trái */
  flip?: boolean;
  className?: string;
  label?: string;
}

export default function CharacterSprite({
  id,
  pose = 'idle',
  size,
  flip = false,
  className,
  label,
}: CharacterSpriteProps) {
  const style = {
    '--row': POSES.indexOf(pose),
    width: size,
    height: size,
    backgroundImage: `url(${characterSheetUrl(id)})`,
  } as CSSProperties;
  return (
    <div
      className={clsx(styles.sprite, flip && styles.flip, pose === 'walk' && styles.fast, className)}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
