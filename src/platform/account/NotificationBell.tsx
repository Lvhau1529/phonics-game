/**
 * Chuông ở thanh trên màn chọn game (chỉ khi đã đăng nhập): số thông báo chưa đọc; bấm mở hộp nhỏ
 * 5 thông báo mới nhất (NotificationPopover) neo ngay dưới chuông. Đóng khi bấm ra ngoài / Esc / Back
 * (mở hộp = thêm một mục lịch sử để nút Back của Android đóng hộp thay vì thoát app).
 */
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { isSignedIn, useAuth } from '@/platform/account/authStore';
import NotificationPopover from '@/platform/account/NotificationPopover';
import { notificationsActions, useUnreadCount } from '@/platform/account/notificationsStore';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import { hashOf, platformActions } from '@/platform/platformStore';
import BellIcon from '@/platform/ui/svg/BellIcon';
import styles from '@/platform/account/NotificationBell.module.scss';

/** Mục lịch sử của hộp đang mở (`history.state`) */
const POPOVER_STATE = { phonicsPopover: 'notifications' } as const;
const isPopoverState = (): boolean =>
  (window.history.state as Partial<typeof POPOVER_STATE> | null)?.phonicsPopover === 'notifications';

export default function NotificationBell({ className }: { className?: string }) {
  const auth = useAuth();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  // Mép dưới chuông lúc mở (px) — màn hẹp hộp chuyển sang position: fixed ngay dưới thanh trên
  const [anchorTop, setAnchorTop] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const bell = useRef<HTMLButtonElement>(null);
  // Đang tự lùi lịch sử để đóng -> popstate kế tiếp không phải người dùng bấm Back
  const closingByHistory = useRef(false);
  const popoverId = useId();

  const openPopover = () => {
    playSfx(SFX.UI_OPEN);
    closingByHistory.current = false;
    setAnchorTop((bell.current?.getBoundingClientRect().bottom ?? 60) + 12);
    setOpen(true);
    window.history.pushState(POPOVER_STATE, '');
    if (navigator.onLine) void notificationsActions.refresh(false);
  };

  /**
   * Đóng hộp. `keepHistory`: không lùi lịch sử (bấm ra ngoài — có thể đang bấm nút chuyển màn khác,
   * lùi lịch sử lúc đó sẽ tranh nhau với điều hướng mới) mà chỉ xoá dấu của hộp khỏi mục hiện tại.
   */
  const close = useCallback((keepHistory = false) => {
    setOpen(false);
    playSfx(SFX.UI_CLOSE);
    if (!isPopoverState()) return;
    if (keepHistory) window.history.replaceState(null, '');
    else {
      closingByHistory.current = true;
      window.history.back();
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) close(true);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      bell.current?.focus();
    };
    // Nút Back của trình duyệt / Android: mục lịch sử của hộp đã bị bỏ, chỉ cần ẩn hộp
    const onPopState = () => {
      if (closingByHistory.current) {
        closingByHistory.current = false;
        return;
      }
      setOpen(false);
      playSfx(SFX.UI_CLOSE);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPopState);
    };
  }, [open, close]);

  if (!isSignedIn(auth)) return null;

  const seeAll = () => {
    playSfx(SFX.UI_CLICK);
    setOpen(false);
    // Thay mục lịch sử của hộp bằng màn MESSAGES: Back từ đó về thẳng màn chọn game
    if (isPopoverState()) window.location.replace(hashOf({ kind: 'account', page: 'notifications' }));
    else platformActions.openAccount('notifications');
  };

  return (
    <div
      ref={wrap}
      className={clsx(styles.wrap, className)}
      style={{ '--popover-top': `${anchorTop}px` } as CSSProperties}
    >
      <button
        ref={bell}
        type="button"
        className={clsx(styles.bell, unread > 0 && styles.hasUnread)}
        aria-label={unread > 0 ? `Messages, ${unread} unread` : 'Messages'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => (open ? close() : openPopover())}
      >
        <BellIcon size={26} />
        {unread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && <NotificationPopover id={popoverId} onSeeAll={seeAll} />}
    </div>
  );
}
