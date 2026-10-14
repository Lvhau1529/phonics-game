/**
 * Nút "có bản mới" — chỉ hiện ở màn chọn game để không cắt ngang ván đang chơi.
 * Hiện lên thì kêu "ting" một lần. Mặc định nổi ở đỉnh màn hình; `className` để màn chứa đặt lại vị trí.
 */
import { useEffect } from 'react';
import clsx from 'clsx';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { useStore } from '@/core/store/useStore';
import { applyUpdate, updateStore } from '@/modules/pwa/stores/updateStore';
import Icon from '@/ui/Icon/Icon';
import styles from '@/modules/pwa/components/UpdateBanner/UpdateBanner.module.scss';

export default function UpdateBanner({ className }: { className?: string }) {
  const ready = useStore(updateStore, (state) => state.ready);

  useEffect(() => {
    if (ready) playSfx(SFX.UPDATE_READY);
  }, [ready]);

  if (!ready) return null;

  return (
    <button
      type="button"
      className={clsx(styles.banner, className)}
      onClick={() => {
        playSfx(SFX.UI_CLICK);
        applyUpdate();
      }}
    >
      <Icon name="update" size={26} /> NEW VERSION! <b>UPDATE</b>
    </button>
  );
}
