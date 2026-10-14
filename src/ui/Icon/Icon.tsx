/**
 * Icon ảnh dùng chung (src/ui/icons.ts) — trang trí, nên `alt` rỗng:
 * nút chứa icon phải tự có `aria-label`.
 */
import clsx from 'clsx';
import { ICONS, type IconName } from '@/ui/icons';
import styles from '@/ui/Icon/Icon.module.scss';

interface IconProps {
  name: IconName;
  /** Cạnh (px CSS) */
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 28, className }: IconProps) {
  return (
    <img
      className={clsx(styles.icon, className)}
      src={ICONS[name]}
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  );
}
