/**
 * Kết quả ván: sao, điểm, số câu đúng, tổng thời gian, hạng trên máy này, từng câu (hình khác loại + thời gian
 * + đúng / sai), kim cương, điểm đồng bộ (đã đăng nhập). Nút: chơi lại, bảng xếp hạng, chọn chủ đề khác.
 */
import clsx from 'clsx';
import { ART } from '@/games/odd-one-out/app/assets';
import OptionArt from '@/games/odd-one-out/app/components/OptionArt';
import { formatDuration } from '@/games/odd-one-out/app/format';
import { useOddOneOut } from '@/games/odd-one-out/app/hooks';
import { getTopic } from '@/games/odd-one-out/content/puzzles';
import { levelLabel } from '@/games/odd-one-out/session/rules';
import { oddOneOutActions } from '@/games/odd-one-out/session/store';
import { TEXT } from '@/games/odd-one-out/session/text';
import type { ActiveRound } from '@/games/odd-one-out/session/types';
import { GemReward } from '@/modules/gems';
import { PointsSynced } from '@/modules/results';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import styles from '@/games/odd-one-out/app/screens/ResultsScreen.module.scss';

export default function ResultsScreen() {
  const round = useOddOneOut((state) => state.round);
  const outcome = useOddOneOut((state) => state.outcome);
  if (!round || !outcome) return null;
  const { record } = outcome;
  const topic = getTopic(record.topic);

  return (
    <div className={styles.results}>
      <div className={styles.hero}>
        <img className={styles.kid} src={ART.girlMap} alt="" />
        <div>
          <p className={styles.kicker}>🌟 {TEXT.complete} 🌟</p>
          <h1 className={styles.title}>
            {TEXT.youDidIt} <span>{record.name}!</span>
          </h1>
          <p className={styles.set}>
            {topic.emoji} {topic.title} · {levelLabel(record.level)} · {record.count} {TEXT.puzzles}
          </p>
        </div>
      </div>

      <div className={styles.stars} aria-label={`${outcome.stars} / 3`}>
        {[0, 1, 2].map((index) => (
          <Icon
            key={index}
            name="star"
            size={56}
            className={clsx(styles.star, index < outcome.stars && styles.earned)}
          />
        ))}
      </div>

      <dl className={styles.stats}>
        <Stat label={TEXT.points} value={`⭐ ${record.score}`} />
        <Stat label={TEXT.correct} value={`${record.correct}/${record.count}`} />
        <Stat label={TEXT.totalTime} value={formatDuration(record.totalMs)} />
        <Stat label={TEXT.rank} value={outcome.rank ? `#${outcome.rank}` : '—'} />
      </dl>

      <PuzzleList round={round} />
      <GemReward amount={outcome.gemsEarned} />
      <PointsSynced sessionId={outcome.syncId} />

      <div className={styles.actions}>
        <Button color="pink" size="lg" onClick={() => oddOneOutActions.playAgain()}>
          {TEXT.playAgain}
        </Button>
        <div className={styles.row}>
          <Button color="purple" onClick={() => oddOneOutActions.openLeaderboard()}>
            <Icon name="trophy" size={22} /> {TEXT.leaderboard}
          </Button>
          <Button color="blue" onClick={() => oddOneOutActions.openSetup()}>
            {TEXT.newTopic}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Từng câu: hình khác loại, đúng / sai, có nói, thời gian */
function PuzzleList({ round }: { round: ActiveRound }) {
  return (
    <section className={styles.list}>
      <h2>{TEXT.puzzleTimes}</h2>
      <ol>
        {round.records.map((record, index) => {
          const current = round.puzzles[index];
          return (
            <li key={record.puzzleId} className={record.correct ? styles.right : styles.miss}>
              <span className={styles.mark}>{record.correct ? '✅' : '💖'}</span>
              <OptionArt option={current.options[current.odd]} className={styles.listArt} />
              <span className={styles.listName}>{current.options[current.odd].name}</span>
              {record.spoke && <span title={TEXT.speakBonus}>🎤</span>}
              <span className={styles.time}>⏱ {formatDuration(record.ms)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
