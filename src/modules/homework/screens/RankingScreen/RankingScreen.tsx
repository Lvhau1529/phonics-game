/**
 * Xếp hạng theo bài (GET /me/assignments/:id/ranking): bài tốt nhất đã chấm của mỗi bạn trong lớp.
 * Dòng của mình được tô màu; chưa có trong bảng thì ghim ở cuối.
 */
import clsx from 'clsx';
import { avatarUrl, isSceneAvatar } from '@/modules/auth/utils/avatars';
import { errorText } from '@/core/api/errorText';
import { useRequest } from '@/core/hooks/useRequest';
import { assignmentsService } from '@/modules/homework/services/assignmentsService';
import type { AssignmentRankingEntryModel } from '@/modules/homework/models/AssignmentRankingEntryModel';
import { useDelayedLoading } from '@/core/hooks/useDelayedLoading';
import { platformActions } from '@/app/stores/platformStore';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/modules/homework/screens/RankingScreen/RankingScreen.module.scss';

export default function RankingScreen({ assignmentId }: { assignmentId: string }) {
  const ranking = useRequest(() => assignmentsService.ranking(assignmentId), `hw-ranking:${assignmentId}`);
  const showLoading = useDelayedLoading(ranking.loading);
  const items = ranking.data?.items ?? [];
  const me = ranking.data?.me ?? null;
  const mePinned = me !== null && !items.some((item) => item.isMe);

  return (
    <>
      <ScreenHeader
        title="RANKING"
        backLabel="Result"
        onBack={() => platformActions.openHomework({ name: 'result', assignmentId })}
        trailing={useDelayedLoading(ranking.isRefreshing) && <LottieLoader size="sm" />}
      />
      <section className={styles.board}>
        <h2 className={styles.heading}>
          <Icon name="trophy" size={26} /> {ranking.data?.worksheetTitle ?? ''}
        </h2>
        {ranking.data && <p className={styles.className}>{ranking.data.className}</p>}
        {showLoading && <LottieLoader size="lg" label="LOADING…" className={styles.status} />}
        {ranking.error != null && (
          <div className={styles.empty}>
            <p className={styles.status}>{errorText(ranking.error)}</p>
            <Button color="cream" onClick={ranking.reload}>
              TRY AGAIN
            </Button>
          </div>
        )}
        {ranking.data && items.length === 0 && (
          <div className={styles.empty}>
            <img className={styles.mascot} src={MASCOT.encourage} alt="" />
            <p className={styles.status}>NO SCORES YET. BE THE FIRST!</p>
          </div>
        )}
        {items.length > 0 && (
          <ol className={styles.list}>
            {items.map((entry) => (
              <Row key={entry.studentId} entry={entry} />
            ))}
            {mePinned && me && <Row entry={me} pinned />}
          </ol>
        )}
      </section>
    </>
  );
}

function Row({ entry, pinned = false }: { entry: AssignmentRankingEntryModel; pinned?: boolean }) {
  return (
    <li className={clsx(styles.row, entry.isMe && styles.me, pinned && styles.pinned)}>
      <span className={clsx(styles.rank, entry.isPodium && styles.top)}>
        {entry.isChampion ? (
          <Icon name="crown" size={30} />
        ) : entry.isPodium ? (
          <Icon name="medal" size={28} />
        ) : (
          entry.rank
        )}
      </span>
      <img
        className={clsx(styles.avatar, isSceneAvatar(entry.avatarKey) && styles.scene)}
        src={avatarUrl(entry.avatarKey)}
        alt=""
      />
      <span className={styles.name}>
        {entry.displayName}
        {entry.isMe && <small> (ME)</small>}
      </span>
      <span className={styles.points}>
        <Icon name="star" size={18} /> {entry.scoreText}
      </span>
    </li>
  );
}
