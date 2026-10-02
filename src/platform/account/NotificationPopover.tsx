/**
 * Hộp nhỏ dưới chuông ở màn chọn game: 5 thông báo mới nhất (chấm chưa đọc, thời gian tương đối),
 * bấm một mục = đã đọc; MARK ALL READ; SEE ALL -> màn MESSAGES. Mở / đóng do NotificationBell quản.
 */
import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import type { NotificationModel } from '@/platform/account/models/NotificationModel';
import { notificationsActions, useNotifications } from '@/platform/account/notificationsStore';
import { timeAgo } from '@/platform/account/timeAgo';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import { useDelayedLoading } from '@/platform/hooks/useDelayedLoading';
import Button from '@/platform/ui/Button';
import { MASCOT } from '@/platform/ui/icons';
import LottieLoader from '@/platform/ui/LottieLoader';
import styles from '@/platform/account/NotificationPopover.module.scss';

const MAX_ITEMS = 5;

interface NotificationPopoverProps {
  id: string;
  onSeeAll: () => void;
}

export default function NotificationPopover({ id, onSeeAll }: NotificationPopoverProps) {
  const { items, unreadCount, loading, loaded } = useNotifications();
  const root = useRef<HTMLDivElement>(null);
  const latest = items.slice(0, MAX_ITEMS);
  // Đang tải lại mà đã có danh sách: chấm nhỏ cạnh tiêu đề (trễ 200ms, giữ ≥ 400ms để không nháy)
  const showRefreshing = useDelayedLoading(loading && latest.length > 0);

  // Mở: focus mục đầu tiên (không có thì nút SEE ALL)
  useEffect(() => {
    root.current?.querySelector<HTMLElement>('li button, [data-see-all]')?.focus();
  }, []);

  return (
    <div ref={root} id={id} className={styles.popover} role="dialog" aria-label="Messages">
      <div className={styles.head}>
        <span className={styles.heading}>
          MESSAGES
          {showRefreshing && <LottieLoader size="sm" className={styles.refreshing} />}
        </span>
        <button
          type="button"
          className={styles.textBtn}
          disabled={unreadCount === 0}
          onClick={() => {
            playSfx(SFX.UI_CLICK);
            void notificationsActions.markRead();
          }}
        >
          MARK ALL READ
        </button>
      </div>

      {latest.length === 0 ? (
        <div className={styles.empty}>
          {loading || !loaded ? (
            <LottieLoader size="sm" />
          ) : (
            <>
              <img className={styles.mascot} src={MASCOT.sleep} alt="" draggable={false} />
              <p className={styles.emptyText}>NO MESSAGES YET</p>
            </>
          )}
        </div>
      ) : (
        <ul className={styles.list}>
          {latest.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </ul>
      )}

      <Button color="blue" className={styles.seeAll} data-see-all onClick={onSeeAll}>
        SEE ALL
      </Button>
    </div>
  );
}

function Item({ item }: { item: NotificationModel }) {
  const unread = item.isUnread;
  return (
    <li>
      <button
        type="button"
        className={clsx(styles.item, unread && styles.unread)}
        aria-label={`${unread ? 'Unread: ' : ''}${item.title}. ${item.body}. ${timeAgo(item.createdAt)}`}
        onClick={() => {
          playSfx(SFX.UI_CLICK);
          if (unread) void notificationsActions.markRead([item.id]);
        }}
      >
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.text}>
          <span className={styles.title}>{item.title}</span>
          <span className={styles.body}>{item.body}</span>
          <time className={styles.time} dateTime={item.createdAt}>
            {timeAgo(item.createdAt)}
          </time>
        </span>
      </button>
    </li>
  );
}
