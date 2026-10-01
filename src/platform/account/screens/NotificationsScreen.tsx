/**
 * MESSAGES: thông báo của học sinh (điểm thưởng, đổi hạng, mở khoá game, lời nhắn GV).
 * Mở màn -> tải cả đã đọc, rồi đánh dấu tất cả đã đọc (chuông về 0).
 * Danh sách đã có trong notificationsStore hiện ngay; đang tải lại chỉ hiện chấm nhỏ ở header.
 */
import { useEffect } from 'react';
import clsx from 'clsx';
import type { NotificationView } from '@phonics/contracts';
import { notificationsActions, useNotifications } from '@/platform/account/notificationsStore';
import { timeAgo } from '@/platform/account/timeAgo';
import { useDelayedLoading } from '@/platform/hooks/useDelayedLoading';
import { platformActions } from '@/platform/platformStore';
import { MASCOT } from '@/platform/ui/icons';
import LottieLoader from '@/platform/ui/LottieLoader';
import ScreenHeader from '@/platform/ui/ScreenHeader';
import BellIcon from '@/platform/ui/svg/BellIcon';
import styles from '@/platform/account/screens/NotificationsScreen.module.scss';

export default function NotificationsScreen() {
  const { items, loading, loaded } = useNotifications();
  const empty = items.length === 0;
  // Chưa có gì để hiện: màn chờ lớn (trễ 200ms, giữ ≥ 400ms); đã có danh sách: chấm nhỏ ở header
  const showLoading = useDelayedLoading(empty && (loading || !loaded));
  const showRefreshing = useDelayedLoading(!empty && loading);

  useEffect(() => {
    void notificationsActions.refresh(false).then(() => notificationsActions.markRead());
  }, []);

  return (
    <>
      <ScreenHeader
        title="MESSAGES"
        backLabel="My profile"
        onBack={() => platformActions.openAccount('profile')}
        trailing={showRefreshing && <LottieLoader size="sm" />}
      />
      {empty ? (
        <div className={styles.empty}>
          {showLoading ? (
            <LottieLoader size="lg" label="LOADING…" className={styles.status} />
          ) : (
            !loading &&
            loaded && (
              <>
                <img className={styles.mascot} src={MASCOT.sleep} alt="" />
                <p className={styles.status}>NO MESSAGES YET</p>
              </>
            )
          )}
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <Message key={item.id} item={item} />
          ))}
        </ul>
      )}
    </>
  );
}

function Message({ item }: { item: NotificationView }) {
  return (
    <li className={clsx(styles.message, !item.readAt && styles.unread)}>
      <span className={styles.icon}>
        <BellIcon size={20} />
      </span>
      <div className={styles.body}>
        <p className={styles.title}>{item.title}</p>
        <p className={styles.text}>{item.body}</p>
        <time className={styles.time} dateTime={item.createdAt}>
          {timeAgo(item.createdAt)}
        </time>
      </div>
    </li>
  );
}
