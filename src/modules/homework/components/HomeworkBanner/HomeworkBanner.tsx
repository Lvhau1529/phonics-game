/**
 * Nút HOMEWORK ở màn chọn game (dưới "Choose a game!"): đã đăng nhập thì kèm số bài còn phải làm;
 * chưa có API (ACCOUNT_ENABLED=false) thì bấm báo COMING SOON qua `onUnavailable`. Khách bấm → màn SIGN IN.
 */
import { useEffect } from 'react';
import clsx from 'clsx';
import { isSignedIn, useAuth } from '@/modules/auth/stores/authStore';
import { ACCOUNT_ENABLED } from '@/core/config/account';
import { homeworkActions, useHomeworkList, useTodoCount } from '@/modules/homework/stores/homeworkStore';
import { platformActions } from '@/app/stores/platformStore';
import Button from '@/ui/Button/Button';
import BookIcon from '@/ui/svg/BookIcon';
import styles from '@/modules/homework/components/HomeworkBanner/HomeworkBanner.module.scss';

interface HomeworkBannerProps {
  className?: string;
  onUnavailable: () => void;
}

export default function HomeworkBanner({ className, onUnavailable }: HomeworkBannerProps) {
  const auth = useAuth();
  const signedIn = isSignedIn(auth);
  const todo = useTodoCount();
  const { loaded } = useHomeworkList();

  // Có badge ngay khi mở app (danh sách cache trong store cả phiên)
  useEffect(() => {
    if (ACCOUNT_ENABLED && signedIn && !loaded) void homeworkActions.loadList();
  }, [signedIn, loaded]);

  const open = () => {
    if (!ACCOUNT_ENABLED) return onUnavailable();
    platformActions.openHomework();
  };

  return (
    <Button
      color="green"
      className={clsx(styles.banner, todo > 0 && styles.hasTodo, className)}
      onClick={open}
    >
      <BookIcon size={24} /> HOMEWORK
      {todo > 0 && (
        <span className={styles.badge} aria-label={`${todo} to do`}>
          {todo > 99 ? '99+' : todo}
        </span>
      )}
    </Button>
  );
}
