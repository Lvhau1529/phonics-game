/**
 * Kết quả lượt (plan §28 "results screen"; §5.2 winner screen chỉ để ăn mừng):
 *   Solo      — LIVE COMPLETE! + sao, điểm, người xem, tim, từ đã học, sang cấp tiếp theo
 *   Classroom — đội thắng / hoà, điểm cả hai đội, không có phản ứng tiêu cực cho đội thua
 */
import clsx from 'clsx';
import { useFoodStream } from '@/games/food-stream/app/hooks';
import { imageUrl, streamerUrl } from '@/games/food-stream/app/assets';
import { getLevel } from '@/games/food-stream/content/levels';
import { getPack } from '@/games/food-stream/content/packs';
import {
  foodStreamActions,
  nextLevelId,
  type ActiveSession,
  type SessionOutcome,
} from '@/games/food-stream/session/store';
import type { QuestionRecord, TeamScore } from '@/games/food-stream/session/types';
import { TEXT } from '@/games/food-stream/session/text';
import PointsSynced from '@/platform/account/PointsSynced';
import Button from '@/platform/ui/Button';
import GemReward from '@/platform/ui/GemReward';
import Icon from '@/platform/ui/Icon';
import { compactNumber } from '@/shared/format';
import styles from '@/games/food-stream/app/screens/ResultsScreen.module.scss';

export default function ResultsScreen() {
  const session = useFoodStream((state) => state.session);
  const outcome = useFoodStream((state) => state.outcome);
  if (!session || !outcome) return null;
  return (
    <div className={styles.results}>
      {session.settings.mode === 'solo' ? (
        <SoloResults session={session} outcome={outcome} />
      ) : (
        <ClassroomResults outcome={outcome} />
      )}
      <WordsLearned records={outcome.result.records} />
      <GemReward amount={outcome.gemsEarned} />
      <PointsSynced sessionId={outcome.syncId} />
      <Actions session={session} />
    </div>
  );
}

function SoloResults({ session, outcome }: { session: ActiveSession; outcome: SessionOutcome }) {
  const { result, previous } = outcome;
  const score = result.teams[0]?.score ?? 0;
  const isNewBest = score > (previous?.best ?? 0) || result.stars > (previous?.stars ?? 0);
  const level = getLevel(session.settings.levelId);
  return (
    <>
      <h1 className={styles.title}>{result.perfect ? TEXT.perfect : TEXT.liveComplete}</h1>
      <div className={styles.solo}>
        <img className={styles.streamer} src={streamerUrl(session.teams[0].streamer)} alt="" />
        <p className={styles.level}>
          {getPack(session.settings.packId).title} · {level.number}. {level.title}
        </p>
        <Stars count={result.stars} />
        {isNewBest && <p className={styles.best}>{TEXT.newBest}</p>}
        <dl className={styles.stats}>
          <Stat label={TEXT.score} value={String(score)} />
          <Stat label={TEXT.viewers} value={compactNumber(result.viewers)} />
          <Stat label={TEXT.hearts} value={compactNumber(result.hearts)} />
          <Stat label={TEXT.bestStreak} value={String(result.teams[0]?.bestStreak ?? 0)} />
        </dl>
        <p className={styles.total}>
          {TEXT.totalViewers}: <b>{compactNumber(outcome.totalViewers)}</b>
        </p>
      </div>
    </>
  );
}

function ClassroomResults({ outcome }: { outcome: SessionOutcome }) {
  const { teams } = outcome.result;
  const top = Math.max(...teams.map((team) => team.score));
  const winners = teams.filter((team) => team.score === top);
  const title = winners.length === 1 ? `${winners[0].team.name} ${TEXT.teamWins}` : TEXT.tie;
  return (
    <>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{TEXT.greatTeamwork}</p>
      <ul className={styles.teams}>
        {teams.map((team) => (
          <TeamCard key={team.team.id} score={team} winner={winners.length === 1 && winners[0] === team} />
        ))}
      </ul>
    </>
  );
}

function TeamCard({ score, winner }: { score: TeamScore; winner: boolean }) {
  return (
    <li className={clsx(styles.team, score.team.id !== 0 && styles.teamB, winner && styles.winner)}>
      {winner && <img className={styles.crown} src={imageUrl('ui.crown')} alt="" />}
      <img
        className={styles.teamStreamer}
        src={streamerUrl(score.team.streamer, winner ? 'wow' : 'happy')}
        alt=""
      />
      <span className={styles.teamName}>{score.team.name}</span>
      <span className={styles.teamScore}>{score.score}</span>
      <dl className={clsx(styles.stats, styles.compact)}>
        <Stat label={TEXT.correct} value={String(score.correct)} />
        <Stat label={TEXT.bestStreak} value={String(score.bestStreak)} />
      </dl>
    </li>
  );
}

/** Từ / âm đã trả lời đúng, có tranh nếu có (plan: "Words learned") */
function WordsLearned({ records }: { records: readonly QuestionRecord[] }) {
  // Mỗi từ một lần; hỏi lại nhiều lần thì chỉ cần một lần đúng ngay là tính "đúng ngay"
  const unique = new Map<string, QuestionRecord>();
  records
    .filter((record) => record.answeredBy !== null)
    .forEach((record) => {
      const seen = unique.get(record.label);
      if (!seen || (!seen.firstTry && record.firstTry)) unique.set(record.label, record);
    });
  if (unique.size === 0) return null;
  return (
    <section className={styles.words}>
      <h2>{TEXT.wordsLearned}</h2>
      <ul>
        {[...unique.values()].map((record) => (
          <li key={record.label} className={record.firstTry ? styles.firstTry : undefined}>
            {record.picture && <img src={imageUrl(record.picture)} alt="" />}
            <span>{record.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Actions({ session }: { session: ActiveSession }) {
  const next = session.settings.mode === 'solo' ? nextLevelId(session.settings) : undefined;
  return (
    <div className={styles.actions}>
      {next && (
        <Button color="pink" size="lg" onClick={() => foodStreamActions.playNextLevel()}>
          {TEXT.nextLevel} <Icon name="next" size={24} />
        </Button>
      )}
      <div className={styles.row}>
        <Button color="green" onClick={() => foodStreamActions.playAgain()}>
          {TEXT.playAgain}
        </Button>
        <Button color="blue" onClick={() => foodStreamActions.openSetup()}>
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
          src={imageUrl('ui.star')}
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
