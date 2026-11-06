/**
 * Nút tài khoản ở thanh trên màn chọn game:
 *   - khách → SIGN IN (tím) → màn đăng nhập phụ huynh
 *   - phụ huynh đã đăng nhập, chưa chọn bé → WHO'S PLAYING? → màn chọn bé
 *   - bé đang chơi → avatar + tên bé; bấm → hỏi người lớn (phép cộng) → màn chọn bé (đổi bé / đăng xuất)
 * Chưa có API (ACCOUNT_ENABLED=false, BE chưa lên): vẫn hiện SIGN IN nhưng bấm chỉ gọi `onUnavailable`
 * (màn chọn game mở hộp COMING SOON) — không mở màn tài khoản, không gọi mạng.
 */
import { useState } from 'react';
import clsx from 'clsx';
import GrownUpGate from '@/modules/auth/components/GrownUpGate/GrownUpGate';
import { isSignedIn, useAuth } from '@/modules/auth/stores/authStore';
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
  const auth = useAuth();
  const [gate, setGate] = useState(false);
  const { user } = auth;

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

  // Phụ huynh đăng nhập nhưng chưa chọn bé
  if (!isSignedIn(auth)) {
    return (
      <Button
        color="purple"
        className={clsx(styles.signIn, className)}
        onClick={() => platformActions.openAccount()}
      >
        <UserIcon size={22} /> WHO&apos;S PLAYING?
      </Button>
    );
  }

  return (
    <>
      <button
        type="button"
        className={clsx(styles.account, className)}
        aria-label={`${user.displayName} — change player`}
        onClick={() => {
          playSfx(SFX.UI_CLICK);
          setGate(true);
        }}
      >
        <img
          className={clsx(styles.avatar, isSceneAvatar(user.avatarKey) && styles.scene)}
          src={avatarUrl(user.avatarKey)}
          alt=""
        />
        <span className={styles.name}>{user.firstName.toUpperCase()}</span>
      </button>
      {gate && (
        <GrownUpGate
          onClose={() => setGate(false)}
          onPass={() => {
            setGate(false);
            platformActions.openAccount();
          }}
        />
      )}
    </>
  );
}
