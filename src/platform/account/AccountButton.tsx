/**
 * Nút tài khoản ở thanh trên màn chọn game: khách -> SIGN IN (tím); đã đăng nhập -> avatar + tên.
 * Không có API (ACCOUNT_ENABLED=false) thì không hiện.
 */
import clsx from 'clsx';
import { firstName, useAuth } from '@/platform/account/authStore';
import { avatarUrl, isSceneAvatar } from '@/platform/account/avatars';
import { ACCOUNT_ENABLED } from '@/platform/account/config';
import { SFX } from '@/platform/audio/sfx';
import { playSfx } from '@/platform/audio/sfxPlayer';
import { platformActions } from '@/platform/platformStore';
import Button from '@/platform/ui/Button';
import UserIcon from '@/platform/ui/svg/UserIcon';
import styles from '@/platform/account/AccountButton.module.scss';

export default function AccountButton({ className }: { className?: string }) {
  const { user } = useAuth();
  if (!ACCOUNT_ENABLED) return null;

  if (!user) {
    return (
      <Button
        color="purple"
        className={clsx(styles.signIn, className)}
        onClick={() => platformActions.openAccount('login')}
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
      <span className={styles.name}>{firstName(user).toUpperCase()}</span>
    </button>
  );
}
