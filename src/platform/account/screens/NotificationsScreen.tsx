/**
 * MESSAGES: thông báo của học sinh (điểm thưởng, đổi hạng, mở khoá game, lời nhắn GV).
 * Mở màn -> tải cả đã đọc, rồi đánh dấu tất cả đã đọc (chuông về 0).
 */
import { useEffect } from 'react';
import clsx from 'clsx';
import type { NotificationView } from '@phonics/contracts';
import { notificationsActions, useNotifications } from '@/platform/account/notificationsStore';
import { platformActions } from '@/platform/platformStore';
import { MASCOT } from '@/platform/ui/icons';
import ScreenHeader from '@/platform/ui/ScreenHeader';
import BellIcon from '@/platform/ui/svg/BellIcon';
import styles from '@/platform/account/screens/NotificationsScreen.module.scss';

export default function NotificationsScreen() {
  const { items, loading, loaded } = useNotifications();

  useEffect(() => {
    void notificationsActions.refresh(false).then(() => notificationsActions.markRead());
  }, []);

  return (
    <>
      <ScreenHeader
        title="MESSAGES"
        backLabel="My profile"
        onBack={() => platformActions.openAccount('profile')}
      />
      {items.length === 0 ? (
        <div className={styles.empty}>
          <img className={styles.mascot} src={MASCOT.sleep} alt="" />
          <p className={styles.status}>{loading || !loaded ? 'LOADING…' : 'NO MESSAGES YET'}</p>
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

/** "JUST NOW" · "5 MIN AGO" · "3 HOURS AGO" · "2 DAYS AGO" · ngày */
function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'JUST NOW';
  if (minutes < 60) return `${minutes} MIN AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'HOUR' : 'HOURS'} AGO`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'DAY' : 'DAYS'} AGO`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
}
