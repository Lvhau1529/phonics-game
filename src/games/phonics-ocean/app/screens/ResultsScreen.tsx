/**
 * Kết quả lượt: LEVEL CLEAR! / TIME'S UP! / TRY AGAIN! + cá đã lớn tới cỡ nào, sao, điểm, tỉ lệ đúng,
 * chuỗi dài nhất, các từ đã "ăn", kim cương; NEXT LEVEL khi qua màn.
 */
import clsx from 'clsx';
import { playerUrl } from '@/games/phonics-ocean/app/assets';
import { usePhonicsOcean } from '@/games/phonics-ocean/app/hooks';
import { getLevel, nextLevel } from '@/games/phonics-ocean/content/levels';
import {
  phonicsOceanActions,
  type ActiveSession,
  type SessionOutcome,
} from '@/games/phonics-ocean/session/store';
import type { RoundResult, WordRecord } from '@/games/phonics-ocean/session/types';
import { TEXT } from '@/games/phonics-ocean/session/text';
import { PointsSynced } from '@/modules/results';
import Button from '@/ui/Button/Button';
import { GemReward } from '@/modules/gems';
import Icon from '@/ui/Icon/Icon';
import { ICONS } from '@/ui/icons';
import { formatPercent } from '@/core/utils/format';
import styles from '@/games/phonics-ocean/app/screens/ResultsScreen.module.scss';

function titleOf(result: RoundResult): string {
  if (result.cleared) return result.stars === 3 && result.accuracy === 1 ? TEXT.perfect : TEXT.levelClear;
  if (result.endedBy === 'time') return TEXT.timesUp;
  return TEXT.tryAgain;
}

export default function ResultsScreen() {
  const session = usePhonicsOcean((state) => state.session);
  const outcome = usePhonicsOcean((state) => state.outcome);
  if (!session || !outcome) return null;
  return (
    <div className={styles.results}>
      <Summary session={session} outcome={outcome} />
      <WordsEaten words={outcome.result.words} />
      <GemReward amount={outcome.gemsEarned} />
      <PointsSynced sessionId={outcome.syncId} />
      <Actions session={session} result={outcome.result} />
    </div>
  );
}

function Summary({ session, outcome }: { session: ActiveSession; outcome: SessionOutcome }) {
  const { result, previous } = outcome;
  const level = getLevel(session.settings.levelId);
  const isNewBest =
    result.cleared && (result.score > (previous?.best ?? 0) || result.stars > (previous?.stars ?? 0));
  return (
    <>
      <h1 className={clsx(styles.title, !result.cleared && styles.soft)}>{titleOf(result)}</h1>
      <div className={styles.card}>
        <img className={styles.fish} src={playerUrl(level.biome)} alt="" />
        <p className={styles.level}>
          {level.number}. {level.title}
        </p>
        <Stars count={result.stars} />
        {isNewBest && <p className={styles.best}>{TEXT.newBest}</p>}
        {!result.cleared && <p className={styles.encourage}>{TEXT.greatJob}</p>}
        <dl className={styles.stats}>
          <Stat label={TEXT.score} value={String(result.score)} />
          <Stat
            label={TEXT.correct}
            value={`${Math.min(result.correct, level.correctToClear)}/${level.correctToClear}`}
          />
          <Stat label={TEXT.accuracy} value={formatPercent(result.accuracy)} />
          <Stat label={TEXT.bestStreak} value={String(result.bestStreak)} />
        </dl>
      </div>
    </>
  );
}

/** Từ đã ăn đúng (xanh = đúng ngay lần đầu) */
function WordsEaten({ words }: { words: readonly WordRecord[] }) {
  if (words.length === 0) return null;
  return (
    <section className={styles.words}>
      <h2>{TEXT.wordsLearned}</h2>
      <ul>
        {words.map((record) => (
          <li key={record.word} className={record.firstTry ? styles.firstTry : undefined}>
            {record.word}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Actions({ session, result }: { session: ActiveSession; result: RoundResult }) {
  const next = result.cleared ? nextLevel(session.settings.levelId) : undefined;
  return (
    <div className={styles.actions}>
      {next && (
        <Button color="green" size="lg" onClick={() => phonicsOceanActions.playNextLevel()}>
          {TEXT.nextLevel} <Icon name="next" size={24} />
        </Button>
      )}
      <div className={styles.row}>
        <Button color={next ? 'blue' : 'green'} onClick={() => phonicsOceanActions.playAgain()}>
          {TEXT.playAgain}
        </Button>
        <Button color="blue" onClick={() => phonicsOceanActions.openSetup()}>
          {TEXT.changeSetup}
        </Button>
      </div>
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className={styles.stars} aria-label={`${count} / 3`}>
      {[0, 1, 2].map((index) => (
        <img
          key={index}
          src={ICONS.star}
          alt=""
          className={index < count ? styles.earned : undefined}
          style={{ animationDelay: `${0.25 + index * 0.3}s` }}
        />
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statsItem}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
