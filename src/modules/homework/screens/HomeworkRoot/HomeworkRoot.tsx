/**
 * Gốc các màn bài tập về nhà (#/homework/...), chunk riêng (PlatformApp):
 *   - chưa chọn bé -> phụ huynh đăng nhập / chọn bé tại chỗ (`ChildRequired`)
 *   - đang khôi phục phiên -> màn chờ ngắn
 *   - list / do / result theo `HomeworkPage`
 * Kèm hộp HƯỚNG DẪN (tiếng Việt) cho giáo viên / phụ huynh.
 */
import type { ReactNode } from 'react';
import { ChildRequired, isSignedIn, useAuth } from '@/modules/auth';
import { HOMEWORK_GUIDE_SECTIONS, HOMEWORK_GUIDE_TITLE } from '@/modules/homework/guide/homeworkGuide';
import DoScreen from '@/modules/homework/screens/DoScreen/DoScreen';
import ListScreen from '@/modules/homework/screens/ListScreen/ListScreen';
import ResultScreen from '@/modules/homework/screens/ResultScreen/ResultScreen';
import type { HomeworkPage } from '@/core/navigation/platformStore';
import GuideDialog from '@/ui/guide/GuideDialog/GuideDialog';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import styles from '@/modules/homework/screens/HomeworkRoot/HomeworkRoot.module.scss';

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
    content = <ChildRequired title="HOMEWORK" />;
  } else {
    switch (page.name) {
      case 'do':
        content = <DoScreen key={page.assignmentId} assignmentId={page.assignmentId} />;
        break;
      case 'result':
        content = <ResultScreen key={page.assignmentId} assignmentId={page.assignmentId} />;
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
