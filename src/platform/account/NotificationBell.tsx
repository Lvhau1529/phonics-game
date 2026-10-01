/**
 * Chuông ở thanh trên màn chọn game (chỉ khi đã đăng nhập): số thông báo chưa đọc, bấm mở MESSAGES.
 */
import clsx from 'clsx';
import { isSignedIn, useAuth } from '@/platform/account/authStore';
import { useUnreadCount } from '@/platform/account/notificationsStore';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import { platformActions } from '@/platform/platformStore';
import BellIcon from '@/platform/ui/svg/BellIcon';
import styles from '@/platform/account/NotificationBell.module.scss';

export default function NotificationBell({ className }: { className?: string }) {
  const auth = useAuth();
  const unread = useUnreadCount();
  if (!isSignedIn(auth)) return null;

  return (
    <button
      type="button"
      className={clsx(styles.bell, unread > 0 && styles.hasUnread, className)}
      aria-label={unread > 0 ? `Messages, ${unread} unread` : 'Messages'}
      onClick={() => {
        playSfx(SFX.UI_CLICK);
        platformActions.openAccount('notifications');
      }}
    >
      <BellIcon size={26} />
      {unread > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}
