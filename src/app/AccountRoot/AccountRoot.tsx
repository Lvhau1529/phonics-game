/**
 * Gốc các màn tài khoản (#/account/...), tải động thành chunk riêng (PlatformApp):
 *   - khách mở màn cần đăng nhập (hồ sơ, sửa, xếp hạng, tin nhắn) -> hiện màn SIGN IN tại chỗ
 *   - đã đăng nhập mà mở login / register -> hồ sơ
 *   - đang khôi phục phiên (vừa mở app) -> màn chờ ngắn
 */
import type { ReactNode } from 'react';
import { isSignedIn, useAuth } from '@/modules/auth';
import EditProfileScreen from '@/modules/auth/screens/EditProfileScreen/EditProfileScreen';
import LoginScreen from '@/modules/auth/screens/LoginScreen/LoginScreen';
import RegisterScreen from '@/modules/auth/screens/RegisterScreen/RegisterScreen';
import NotificationsScreen from '@/modules/notifications/screens/NotificationsScreen/NotificationsScreen';
import ProfileScreen from '@/modules/points/screens/ProfileScreen/ProfileScreen';
import RankingScreen from '@/modules/points/screens/RankingScreen/RankingScreen';
import type { AccountPage } from '@/core/navigation/platformStore';
import type { GameManifest } from '@/core/types/game';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import styles from '@/app/AccountRoot/AccountRoot.module.scss';

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
