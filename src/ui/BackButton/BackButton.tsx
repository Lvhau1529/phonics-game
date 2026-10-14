/**
 * Nút quay lại tròn (icon mũi tên dùng chung + tiếng "back") cho header các màn React của mọi game.
 */
import clsx from 'clsx';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import Icon from '@/ui/Icon/Icon';
import styles from '@/ui/styles/IconButton.module.scss';

interface BackButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export default function BackButton({ label, onClick, className }: BackButtonProps) {
  return (
    <button
      type="button"
      className={clsx(styles.iconBtn, className)}
      aria-label={label}
      onClick={() => {
        playSfx(SFX.UI_BACK);
        onClick();
      }}
    >
      <Icon name="back" size={26} />
    </button>
  );
}
