/**
 * Gốc các màn tài khoản (#/account/...), tải động thành chunk riêng (PlatformApp):
 *   - khách mở màn cần đăng nhập (hồ sơ, sửa, xếp hạng, tin nhắn) -> hiện màn SIGN IN tại chỗ
 *   - đã đăng nhập mà mở login / register -> hồ sơ
 *   - đang khôi phục phiên (vừa mở app) -> màn chờ ngắn
 */
import type { ReactNode } from 'react';
import { isSignedIn, useAuth } from '@/platform/account/authStore';
import EditProfileScreen from '@/platform/account/screens/EditProfileScreen';
import LoginScreen from '@/platform/account/screens/LoginScreen';
import NotificationsScreen from '@/platform/account/screens/NotificationsScreen';
import ProfileScreen from '@/platform/account/screens/ProfileScreen';
import RankingScreen from '@/platform/account/screens/RankingScreen';
import RegisterScreen from '@/platform/account/screens/RegisterScreen';
import type { AccountPage } from '@/platform/platformStore';
import type { GameManifest } from '@/platform/types';
import { MASCOT } from '@/platform/ui/icons';
import LottieLoader from '@/platform/ui/LottieLoader';
import styles from '@/platform/account/screens/AccountRoot.module.scss';

interface AccountRootProps {
  page: AccountPage;
  /** Game ở màn chọn game (đã phủ catalog) — hồ sơ / xếp hạng hiện tên game */
  games: readonly GameManifest[];
}

export default function AccountRoot({ page, games }: AccountRootProps) {
  const auth = useAuth();
  const signedIn = isSignedIn(auth);

  let content: ReactNode;
  if (auth.status === 'restoring') {
    content = (
      <div className={styles.loading}>
        <img className={styles.mascot} src={MASCOT.loading} alt="" />
        <LottieLoader size="lg" label="LOADING…" />
      </div>
    );
  } else if (!signedIn) {
    content = page === 'register' ? <RegisterScreen /> : <LoginScreen />;
  } else {
    switch (page) {
      case 'edit':
        content = <EditProfileScreen />;
        break;
      case 'ranking':
        content = <RankingScreen games={games} />;
        break;
      case 'notifications':
        content = <NotificationsScreen />;
        break;
      default:
        content = <ProfileScreen games={games} />;
    }
  }

  return (
    <main className={styles.root}>
      <div className={styles.screen}>{content}</div>
    </main>
  );
}
