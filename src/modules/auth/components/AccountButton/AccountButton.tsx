/**
 * Nút tài khoản ở thanh trên màn chọn game: khách -> SIGN IN (tím); đã đăng nhập -> avatar + tên.
 * Chưa có API (ACCOUNT_ENABLED=false, BE chưa lên): vẫn hiện SIGN IN nhưng bấm chỉ gọi `onUnavailable`
 * (màn chọn game mở hộp COMING SOON) — không mở màn tài khoản, không gọi mạng.
 */
import clsx from 'clsx';
import { useAuth } from '@/modules/auth/stores/authStore';
import { avatarUrl, isSceneAvatar } from '@/modules/auth/utils/avatars';
import { ACCOUNT_ENABLED } from '@/core/config/account';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { platformActions } from '@/core/navigation/platformStore';
import Button from '@/ui/Button/Button';
import UserIcon from '@/ui/svg/UserIcon';
import styles from '@/modules/auth/components/AccountButton/AccountButton.module.scss';

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
