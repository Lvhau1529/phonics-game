/**
 * Gốc các màn bài tập về nhà (#/homework/...), chunk riêng (PlatformApp):
 *   - khách -> màn SIGN IN tại chỗ (đăng nhập xong về hồ sơ, bấm HOMEWORK để vào lại)
 *   - đang khôi phục phiên -> màn chờ ngắn
 *   - list / do / result / ranking theo `HomeworkPage`
 * Kèm hộp HƯỚNG DẪN (tiếng Việt) cho giáo viên / phụ huynh.
 */
import type { ReactNode } from 'react';
import { isSignedIn, useAuth } from '@/platform/account/authStore';
import LoginScreen from '@/platform/account/screens/LoginScreen';
import {
  HOMEWORK_GUIDE_SECTIONS,
  HOMEWORK_GUIDE_TITLE,
} from '@/platform/homework/screens/guide/homeworkGuide';
import DoScreen from '@/platform/homework/screens/DoScreen';
import ListScreen from '@/platform/homework/screens/ListScreen';
import RankingScreen from '@/platform/homework/screens/RankingScreen';
import ResultScreen from '@/platform/homework/screens/ResultScreen';
import type { HomeworkPage } from '@/platform/platformStore';
import GuideDialog from '@/platform/ui/guide/GuideDialog';
import { MASCOT } from '@/platform/ui/icons';
import LottieLoader from '@/platform/ui/LottieLoader';
import styles from '@/platform/homework/screens/HomeworkRoot.module.scss';

export default function HomeworkRoot({ page }: { page: HomeworkPage }) {
  const auth = useAuth();
  let content: ReactNode;
  if (auth.status === 'restoring') {
    content = (
      <div className={styles.loading}>
        <img className={styles.mascot} src={MASCOT.loading} alt="" />
        <LottieLoader size="lg" label="LOADING…" />
      </div>
    );
  } else if (!isSignedIn(auth)) {
    content = <LoginScreen />;
  } else {
    switch (page.name) {
      case 'do':
        content = <DoScreen key={page.assignmentId} assignmentId={page.assignmentId} />;
        break;
      case 'result':
        content = <ResultScreen key={page.assignmentId} assignmentId={page.assignmentId} />;
        break;
      case 'ranking':
        content = <RankingScreen key={page.assignmentId} assignmentId={page.assignmentId} />;
        break;
      default:
        content = <ListScreen />;
    }
  }
  return (
    <main className={styles.root}>
      <div className={styles.screen}>{content}</div>
      <GuideDialog title={HOMEWORK_GUIDE_TITLE} sections={HOMEWORK_GUIDE_SECTIONS} />
    </main>
  );
}
