/**
 * Màn chờ tải dùng chung: nền trời Arcade, linh vật chạy, ba chấm LOADING… và (nếu biết) thanh tiến độ.
 *   - PlatformApp: đang tải chunk của game (không biết tiến độ)
 *   - PhaserHost: đã vào màn chơi nhưng Phaser chưa tải xong ảnh / âm thanh (`progress` 0–1); tải xong game
 *     tự vào ván, bé không phải bấm lại
 * `LoadingBar`: thanh mảnh ở đáy màn khi màn React (Home / Setup) đang phủ lên game còn đang tải phía sau.
 * Cả hai chỉ hiện sau một nhịp (tải nhanh thì không nháy) — xem useDelayedLoading.
 */
import { useDelayedLoading } from '@/core/hooks/useDelayedLoading';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import styles from '@/ui/GameLoading/GameLoading.module.scss';

const percent = (progress: number): string => `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`;

export default function GameLoading({ progress }: { progress?: number }) {
  const show = useDelayedLoading(true);
  return (
    <div className={styles.screen}>
      {show && (
        <>
          <img className={styles.mascot} src={MASCOT.loading} alt="" />
          <LottieLoader size="lg" label="LOADING…" />
          {progress !== undefined && (
            <span className={styles.track} aria-hidden="true">
              <span className={styles.fill} style={{ width: percent(progress) }} />
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function LoadingBar({ progress }: { progress: number }) {
  const show = useDelayedLoading(true, { delay: 400 });
  if (!show) return null;
  return (
    <span
      className={styles.bar}
      role="progressbar"
      aria-label="Loading"
      aria-valuenow={Math.round(progress * 100)}
    >
      <span className={styles.fill} style={{ width: percent(progress) }} />
    </span>
  );
}
