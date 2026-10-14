/**
 * Nút "kẹo" dùng chung cho các màn React của mọi game. Màu lấy từ biến CSS của theme đang dùng.
 */
import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { SFX, type SfxKey } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import styles from '@/ui/Button/Button.module.scss';

export type ButtonColor = 'green' | 'blue' | 'red' | 'orange' | 'cream' | 'pink' | 'purple';

/** Cam là màu mặc định của .btn nên không cần class riêng */
const COLOR_CLASS: Record<ButtonColor, string | undefined> = {
  orange: undefined,
  green: styles.green,
  blue: styles.blue,
  red: styles.red,
  pink: styles.pink,
  purple: styles.purple,
  cream: styles.cream,
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  size?: 'md' | 'lg';
  /** Âm thanh khi bấm; `null` = im lặng */
  sfx?: SfxKey | null;
}

export default function Button({
  color = 'orange',
  size = 'md',
  sfx = SFX.UI_CLICK,
  className,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(styles.btn, COLOR_CLASS[color], size === 'lg' && styles.lg, className)}
      onClick={(event) => {
        if (sfx) playSfx(sfx);
        onClick?.(event);
      }}
      {...rest}
    />
  );
}
