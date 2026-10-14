/**
 * HOMEWORK: danh sách bài giao của bé — tab TO DO / DONE / ALL; mỗi thẻ: tên phiếu, trạng thái, sao / điểm,
 * nút START · CONTINUE · SEE RESULT (· TRY AGAIN khi còn lượt). Nhận xét chưa đọc hiện chấm đỏ.
 */
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { errorText } from '@/core/api/errorText';
import type { AssignmentModel } from '@/modules/homework/models/AssignmentModel';
import { homeworkActions, useHomeworkList } from '@/modules/homework/stores/homeworkStore';
import { useDelayedLoading } from '@/core/hooks/useDelayedLoading';
import { platformActions } from '@/core/navigation/platformStore';
import Button from '@/ui/Button/Button';
import GuideButton from '@/ui/guide/GuideButton/GuideButton';
import Stars from '@/modules/homework/components/Stars/Stars';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import OptionGroup, { type Option } from '@/ui/OptionGroup/OptionGroup';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/modules/homework/screens/ListScreen/ListScreen.module.scss';

type Tab = 'todo' | 'done' | 'all';

const TABS: Option<Tab>[] = [
  { value: 'todo', label: 'TO DO', tone: 'green' },
  { value: 'done', label: 'DONE', tone: 'blue' },
  { value: 'all', label: 'ALL', tone: 'orange' },
];

export default function ListScreen() {
  const list = useHomeworkList();
  const [tab, setTab] = useState<Tab>('todo');
  const showLoading = useDelayedLoading(list.loading && !list.loaded);
  const showRefreshing = useDelayedLoading(list.loading && list.loaded);

  useEffect(() => {
    void homeworkActions.loadList();
  }, []);

  const items = list.items.filter((item) =>
    tab === 'todo' ? item.isTodo || item.isInProgress : tab === 'done' ? item.isDone : true,
  );

  return (
    <>
      <ScreenHeader
        title="HOMEWORK"
        backLabel="All games"
        onBack={() => platformActions.exitToHub()}
        trailing={showRefreshing && <LottieLoader size="sm" />}
      />
      <div className={styles.tabs}>
        <OptionGroup label="Show" options={TABS} value={tab} onChange={setTab} />
      </div>

      {showLoading && <LottieLoader size="lg" label="LOADING…" className={styles.status} />}
      {list.error != null && (
        <div className={styles.empty}>
          <p className={styles.status}>{errorText(list.error)}</p>
          <Button color="cream" onClick={() => void homeworkActions.loadList()}>
            TRY AGAIN
          </Button>
        </div>
      )}
      {list.loaded && items.length === 0 && (
        <div className={styles.empty}>
          <img className={styles.mascot} src={tab === 'todo' ? MASCOT.celebrate : MASCOT.sleep} alt="" />
          <p className={styles.status}>
            {tab === 'todo' ? 'ALL DONE! NO HOMEWORK NOW.' : 'NOTHING HERE YET.'}
          </p>
        </div>
      )}
      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </ul>
      )}
      <GuideButton label="GUIDE" className={styles.guide} />
    </>
  );
}

function Card({ item }: { item: AssignmentModel }) {
  const primary = () => {
    playSfx(SFX.UI_START);
    if (item.isDone && !item.canStart)
      platformActions.openHomework({ name: 'result', assignmentId: item.id });
    else platformActions.openHomework({ name: 'do', assignmentId: item.id });
  };
  return (
    <li className={clsx(styles.card, item.isTodo && styles.todo, item.isGraded && styles.graded)}>
      <div className={styles.head}>
        <h2 className={styles.title}>{item.worksheetTitle}</h2>
        <span className={clsx(styles.badge, styles[`s_${item.statusLabel.replace(/\s/g, '_')}`])}>
          {item.statusLabel}
        </span>
      </div>
      <p className={styles.sub}>
        {item.subtitle} · {item.itemCount} {item.itemCount === 1 ? 'QUESTION' : 'QUESTIONS'}
        {item.unreadComments > 0 && <span className={styles.unread}> · {item.unreadComments} NEW NOTE</span>}
      </p>
      {item.isGraded && (
        <p className={styles.score}>
          <Stars count={item.stars} /> {item.scoreText}
          {item.best?.rank && <span className={styles.rank}>#{item.best.rank}</span>}
        </p>
      )}
      <div className={styles.actions}>
        {item.isDone && (
          <Button
            color="blue"
            onClick={() => platformActions.openHomework({ name: 'result', assignmentId: item.id })}
          >
            SEE RESULT
          </Button>
        )}
        {(item.canStart || !item.isDone) && (
          <Button color={item.isDone ? 'cream' : 'green'} disabled={!item.canStart} onClick={primary}>
            {item.canStart ? item.actionLabel : item.isUpcoming ? 'SOON' : 'CLOSED'}
          </Button>
        )}
      </div>
    </li>
  );
}
