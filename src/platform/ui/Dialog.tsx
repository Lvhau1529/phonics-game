/**
 * Hộp thoại dùng chung của Phonics Arcade: nền tối, khung kem viền mực, nút đóng tròn đỏ,
 * (tuỳ chọn) ảnh linh vật ong phía trên tiêu đề. Esc hoặc bấm ra ngoài để đóng.
 * Mở thì phát tiếng `openSfx` (mặc định UI_OPEN), đóng phát UI_CLOSE.
 */
import { useEffect, useId, type ReactNode } from 'react';
import clsx from 'clsx';
import { SFX, type SfxKey } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import Icon from '@/platform/ui/Icon';
import iconButton from '@/platform/ui/IconButton.module.scss';
import styles from '@/platform/ui/Dialog.module.scss';

interface DialogProps {
  title: string;
  onClose: () => void;
  /** Ảnh minh hoạ (thường là linh vật ong — MASCOT) */
  image?: string;
  /** Tiếng khi mở; `null` = im lặng */
  openSfx?: SfxKey | null;
  /** Linh vật nhảy ăn mừng thay vì nhún nhẹ (vd vừa mở khoá game) */
  celebrate?: boolean;
  className?: string;
  children: ReactNode;
  /** Hàng nút cuối hộp */
  actions?: ReactNode;
}

export default function Dialog({
  title,
  onClose,
  image,
  openSfx = SFX.UI_OPEN,
  celebrate = false,
  className,
  children,
  actions,
}: DialogProps) {
  const titleId = useId();

  const close = () => {
    playSfx(SFX.UI_CLOSE);
    onClose();
  };

  // Phát khi mở (và khi hộp chuyển sang bước khác có tiếng riêng, vd xác nhận -> đã mở khoá)
  useEffect(() => {
    if (openSfx) playSfx(openSfx);
  }, [openSfx]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        playSfx(SFX.UI_CLOSE);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={close}>
      <div
        className={clsx(styles.dialog, image && styles.withImage, celebrate && styles.celebrate, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={clsx(iconButton.iconBtn, iconButton.close, styles.close)}
          aria-label="Close"
          onClick={close}
        >
          <Icon name="close" size={22} />
        </button>
        {image && <img className={styles.image} src={image} alt="" draggable={false} />}
        {/* Chỉ phần nội dung cuộn: nút đóng / linh vật nhô ra ngoài hộp không bị cắt và không sinh thanh cuộn ngang */}
        <div className={styles.content}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <div className={styles.body}>{children}</div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </div>
    </div>
  );
}
