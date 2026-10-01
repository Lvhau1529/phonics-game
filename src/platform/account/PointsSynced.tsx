/**
 * Trạng thái gửi điểm của ván vừa chơi ở màn kết quả (cạnh <GemReward>), chỉ học sinh đã đăng nhập:
 *   "+N POINTS · TOTAL X"  — server đã ghi (N = pointsAwarded, X = tổng điểm)
 *   "SAVING POINTS…"       — đang gửi
 *   "POINTS WILL BE SAVED WHEN ONLINE" — mất mạng, nằm trong hàng đợi
 * `sessionId` = clientSessionId do postSoloResult trả về; null / undefined (khách, ván lớp) -> không hiện.
 */
import clsx from 'clsx';
import { syncStore } from '@/platform/account/scoreSync';
import { useStore } from '@/platform/hooks/useStore';
import Icon from '@/platform/ui/Icon';
import LottieLoader from '@/platform/ui/LottieLoader';
import styles from '@/platform/account/PointsSynced.module.scss';

export default function PointsSynced({ sessionId }: { sessionId: string | null | undefined }) {
  const sync = useStore(syncStore, (state) => state);
  if (!sessionId) return null;

  const saved = sync.saved[sessionId];
  if (saved) {
    return (
      <p className={clsx(styles.synced, styles.done)} role="status">
        <Icon name="star" size={30} className={styles.icon} />
        <b>+{saved.pointsAwarded}</b> {saved.pointsAwarded === 1 ? 'POINT' : 'POINTS'} · TOTAL{' '}
        {saved.totals.all}
        {saved.duplicate && <small> (ALREADY SAVED)</small>}
      </p>
    );
  }
  if (sync.failed.includes(sessionId)) return null;
  if (!sync.pending.includes(sessionId)) return null;

  const offline = sync.offline || !navigator.onLine;
  return (
    <p className={clsx(styles.synced, offline && styles.offline)} role="status">
      {offline ? (
        'POINTS WILL BE SAVED WHEN ONLINE'
      ) : (
        <>
          <LottieLoader size="sm" /> SAVING POINTS…
        </>
      )}
    </p>
  );
}
