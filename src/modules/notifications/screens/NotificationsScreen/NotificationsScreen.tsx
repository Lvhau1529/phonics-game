/**
 * MESSAGES: thông báo của học sinh (điểm thưởng, đổi hạng, mở khoá game, lời nhắn GV).
 * Mở màn -> tải cả đã đọc, rồi đánh dấu tất cả đã đọc (chuông về 0).
 * Danh sách đã có trong notificationsStore hiện ngay; đang tải lại chỉ hiện chấm nhỏ ở header.
 */
import { useEffect } from 'react';
import clsx from 'clsx';
import type { NotificationModel } from '@/modules/notifications/models/NotificationModel';
import { notificationsActions, useNotifications } from '@/modules/notifications/stores/notificationsStore';
import { timeAgo } from '@/core/utils/timeAgo';
import { useDelayedLoading } from '@/core/hooks/useDelayedLoading';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { platformActions } from '@/core/navigation/platformStore';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import BellIcon from '@/ui/svg/BellIcon';
import styles from '@/modules/notifications/screens/NotificationsScreen/NotificationsScreen.module.scss';

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

function Message({ item }: { item: NotificationModel }) {
  const target = item.target;
  const body = (
    <>
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
    </>
  );
  // Thông báo bài tập: cả mục là nút mở màn làm bài / kết quả
  return (
    <li className={clsx(styles.message, item.isUnread && styles.unread, target && styles.link)}>
      {target ? (
        <button
          type="button"
          className={styles.open}
          onClick={() => {
            playSfx(SFX.UI_CLICK);
            platformActions.openHomework(target);
          }}
        >
          {body}
        </button>
      ) : (
        body
      )}
    </li>
  );
}
