/**
 * Nút tài khoản ở thanh trên màn chọn game: khách -> SIGN IN (tím); đã đăng nhập -> avatar + tên.
 * Chưa có API (ACCOUNT_ENABLED=false, BE chưa lên): vẫn hiện SIGN IN nhưng bấm chỉ gọi `onUnavailable`
 * (màn chọn game mở hộp COMING SOON) — không mở màn tài khoản, không gọi mạng.
 */
import clsx from 'clsx';
import { useAuth } from '@/platform/account/authStore';
import { avatarUrl, isSceneAvatar } from '@/platform/account/avatars';
import { ACCOUNT_ENABLED } from '@/platform/account/config';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import { platformActions } from '@/platform/platformStore';
import Button from '@/platform/ui/Button';
import UserIcon from '@/platform/ui/svg/UserIcon';
import styles from '@/platform/account/AccountButton.module.scss';

interface AccountButtonProps {
  className?: string;
  /** Bấm SIGN IN khi chưa có API (tính năng đang phát triển) */
  onUnavailable: () => void;
}

export default function AccountButton({ className, onUnavailable }: AccountButtonProps) {
  const { user } = useAuth();

  if (!ACCOUNT_ENABLED || !user) {
    return (
      <Button
        color="purple"
        className={clsx(styles.signIn, className)}
        onClick={() => (ACCOUNT_ENABLED ? platformActions.openAccount('login') : onUnavailable())}
      >
        <UserIcon size={22} /> SIGN IN
      </Button>
    );
  }

  return (
    <button
      type="button"
      className={clsx(styles.account, className)}
      aria-label={`${user.displayName} — my profile`}
      onClick={() => {
        playSfx(SFX.UI_CLICK);
        platformActions.openAccount('profile');
      }}
    >
      <img
        className={clsx(styles.avatar, isSceneAvatar(user.avatarKey) && styles.scene)}
        src={avatarUrl(user.avatarKey)}
        alt=""
      />
      <span className={styles.name}>{user.firstName.toUpperCase()}</span>
    </button>
  );
}
