/**
 * Bộ đếm kim cương ở góc màn chọn game. Vừa chơi xong ván có kim cương thì số "đếm" lên từng viên
 * (tiếng tách tách), kèm bong bóng "+N"; bấm vào mở hộp động viên (HubDialogs › GemsDialog).
 */
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { takePendingGain, walletStore } from '@/modules/gems/stores/walletStore';
import { useStore } from '@/core/store/useStore';
import Icon from '@/ui/Icon/Icon';
import styles from '@/modules/gems/components/GemCounter/GemCounter.module.scss';

/** Chờ màn chọn game hiện xong rồi mới đếm */
const START_DELAY_MS = 500;
const TICK_MS = 110;
/** Đếm tối đa ngần này nhịp (nhận nhiều thì mỗi nhịp cộng nhiều viên) */
const MAX_TICKS = 15;
const BUBBLE_MS = 1800;

export default function GemCounter({ onOpen }: { onOpen: () => void }) {
  const gems = useStore(walletStore, (state) => state.gems);
  // Đọc (không xoá) ở lần render đầu — StrictMode gọi initializer 2 lần nên không được có tác dụng phụ
  const [gain] = useState(() => walletStore.get().pendingGain);
  const [counting, setCounting] = useState<number | null>(gain > 0 ? gems - gain : null);
  const [bubble, setBubble] = useState(false);

  useEffect(() => {
    if (gain <= 0) return undefined;
    takePendingGain();
    const step = Math.max(1, Math.ceil(gain / MAX_TICKS));
    const target = walletStore.get().gems;
    let value = target - gain;
    let interval = 0;
    const start = window.setTimeout(() => {
      setBubble(true);
      interval = window.setInterval(() => {
        value = Math.min(target, value + step);
        setCounting(value);
        if (value < target) {
          playSfx(SFX.GEM_COUNT);
          return;
        }
        window.clearInterval(interval);
        playSfx(SFX.GEM_COLLECT);
        setCounting(null);
        window.setTimeout(() => setBubble(false), BUBBLE_MS);
      }, TICK_MS);
    }, START_DELAY_MS);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [gain]);

  return (
    <button
      type="button"
      className={clsx(styles.counter, counting !== null && styles.counting)}
      aria-label={`${gems} gems`}
      onClick={onOpen}
    >
      <Icon name="gem" size={34} className={styles.icon} />
      <span className={styles.value}>{counting ?? gems}</span>
      {bubble && (
        <span className={styles.bubble} aria-hidden="true">
          +{gain}
        </span>
      )}
    </button>
  );
}
