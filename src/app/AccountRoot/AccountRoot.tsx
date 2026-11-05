/**
 * Gốc các màn tài khoản gia đình, tải động thành chunk riêng (PlatformApp):
 *   - #/set-password?token=… → đặt mật khẩu từ link mời (không cần đăng nhập)
 *   - chưa đăng nhập tài khoản gia đình → màn đăng nhập phụ huynh
 *   - đã đăng nhập → màn chọn bé (#/account)
 *   - đang khôi phục phiên (vừa mở app) → màn chờ ngắn
 */
import type { ReactNode } from 'react';
import { isFamilySignedIn, useAuth } from '@/modules/auth';
import LoginScreen from '@/modules/auth/screens/LoginScreen/LoginScreen';
import ProfilesScreen from '@/modules/auth/screens/ProfilesScreen/ProfilesScreen';
import SetPasswordScreen from '@/modules/auth/screens/SetPasswordScreen/SetPasswordScreen';
import type { AccountPage } from '@/core/navigation/platformStore';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import styles from '@/app/AccountRoot/AccountRoot.module.scss';

/** Màn tài khoản, hoặc đặt mật khẩu kèm token của link mời */
export type AccountView = { page: AccountPage } | { page: 'set-password'; token: string };

export default function AccountRoot({ view }: { view: AccountView }) {
  const auth = useAuth();

  let content: ReactNode;
  if (view.page === 'set-password') {
    content = <SetPasswordScreen token={view.token} />;
  } else if (auth.status === 'restoring') {
    content = (
      <div className={styles.loading}>
        <img className={styles.mascot} src={MASCOT.loading} alt="" />
        <LottieLoader size="lg" label="LOADING…" />
      </div>
    );
  } else if (!isFamilySignedIn(auth)) {
    content = <LoginScreen />;
  } else {
    content = <ProfilesScreen />;
  }

  return (
    <main className={styles.root}>
      <div className={styles.screen}>{content}</div>
    </main>
  );
}
