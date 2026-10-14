/**
 * Các "viên" dùng chung của renderer (chạm là chọn — không kéo thả):
 *   ImageTile  — ảnh (ảnh của phiếu theo mediaId) có thể chọn, kèm nhãn / số ở góc
 *   WordChip   — thẻ từ (word bank, thẻ sắp xếp)
 *   LetterTile — ô chữ (ô trống, chữ đã điền, chữ cho sẵn); `active` = đang nhận bàn phím
 *   Slot       — chỗ trống chờ đặt từ
 * Mục tiêu chạm ≥ 48px; `state` tô màu khi xem lại (ok / bad).
 */
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { useMedia } from '@/modules/homework/renderers/mediaContext';
import styles from '@/modules/homework/components/tiles/tiles.module.scss';

export type TileState = 'ok' | 'bad' | undefined;

interface ImageTileProps {
  mediaId: string;
  label?: string;
  /** Số / chữ ở góc (NUMBER_PICTURES) */
  corner?: ReactNode;
  selected?: boolean;
  /** Gạch chéo (ODD_ONE_OUT) */
  crossed?: boolean;
  state?: TileState;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function ImageTile({
  mediaId,
  label,
  corner,
  selected,
  crossed,
  state,
  disabled,
  size = 'md',
  onClick,
}: ImageTileProps) {
  const media = useMedia(mediaId);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={clsx(
        styles.image,
        styles[size],
        selected && styles.selected,
        crossed && styles.crossed,
        state && styles[state],
      )}
      disabled={onClick ? disabled : undefined}
      aria-pressed={onClick ? !!selected : undefined}
      onClick={
        onClick &&
        (() => {
          playSfx(SFX.UI_CLICK);
          onClick();
        })
      }
    >
      {media ? (
        <img src={media.url} alt={label ?? ''} draggable={false} />
      ) : (
        <span className={styles.missing} />
      )}
      {label && <span className={styles.label}>{label}</span>}
      {corner !== undefined && corner !== null && <span className={styles.corner}>{corner}</span>}
    </Tag>
  );
}

interface WordChipProps {
  children: ReactNode;
  selected?: boolean;
  /** Đã dùng (mờ đi, không bấm) */
  used?: boolean;
  state?: TileState;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function WordChip({ children, selected, used, state, disabled, onClick, className }: WordChipProps) {
  return (
    <button
      type="button"
      className={clsx(
        styles.chip,
        selected && styles.selected,
        used && styles.used,
        state && styles[state],
        className,
      )}
      disabled={disabled || used}
      aria-pressed={!!selected}
      onClick={() => {
        playSfx(SFX.UI_CLICK);
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

interface LetterTileProps {
  letter: string;
  /** Ô cho sẵn (không sửa) */
  fixed?: boolean;
  /** Ô trống đang nhận bàn phím */
  active?: boolean;
  state?: TileState;
  /** Ô nhỏ (lưới ô chữ) */
  small?: boolean;
  onClick?: () => void;
}

export function LetterTile({ letter, fixed, active, state, small, onClick }: LetterTileProps) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={clsx(
        styles.letter,
        fixed && styles.fixed,
        active && styles.active,
        small && styles.small,
        state && styles[state],
      )}
      onClick={onClick}
    >
      {letter || (fixed ? '' : '_')}
    </Tag>
  );
}

interface SlotProps {
  children?: ReactNode;
  active?: boolean;
  state?: TileState;
  onClick?: () => void;
  wide?: boolean;
}

export function Slot({ children, active, state, onClick, wide }: SlotProps) {
  return (
    <button
      type="button"
      className={clsx(
        styles.slot,
        active && styles.active,
        children && styles.filled,
        wide && styles.wide,
        state && styles[state],
      )}
      onClick={() => {
        playSfx(SFX.UI_CLICK);
        onClick?.();
      }}
      disabled={!onClick}
    >
      {children ?? ' '}
    </button>
  );
}
