/**
 * Final Results (plan §22) — chỉ xuất hiện khi mọi đội đã chơi xong.
 * Class: bảng xếp hạng + mở quà cho đội thắng. Solo: thành tích cá nhân.
 */
import clsx from 'clsx';
import { ICONS, mascotUrl } from '@/games/bread-catcher/app/assets';
import PointsSynced from '@/platform/account/PointsSynced';
import Button from '@/platform/ui/Button';
import GemReward from '@/platform/ui/GemReward';
import Leaderboard, { TeamTotalsCard } from '@/games/bread-catcher/app/components/Leaderboard';
import { useAppState, useTeamTotals } from '@/games/bread-catcher/app/hooks';
import { SFX } from '@/platform/audio/sfx';
import { accuracyOf, rankTeams, winnersOf, type Standing } from '@/games/bread-catcher/session/ranking';
import { sessionActions, type ActiveSession } from '@/games/bread-catcher/session/sessionStore';
import { LEVELS } from '@/games/bread-catcher/session/settings';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import type { TurnResult } from '@/games/bread-catcher/session/types';
import { formatPercent, formatTime } from '@/shared/format';
import styles from '@/games/bread-catcher/app/screens/ResultsScreen.module.scss';

/** Màu theo hạng 1–3 (Class Mode có 3 đội) */
const PLACE_CLASS = [styles.place1, styles.place2, styles.place3];

export default function ResultsScreen() {
  const session = useAppState((state) => state.session);
  if (!session) return null;
  return session.settings.mode === 'solo' ? (
    <SoloResults session={session} />
  ) : (
    <ClassResults session={session} />
  );
}

function ClassResults({ session }: { session: ActiveSession }) {
  const standings = rankTeams(session.teams, session.results);
  const winners = winnersOf(standings);
  const hasTotals = useTeamTotals().length > 0;

  return (
    <div className={styles.results}>
      <h1 className={styles.title}>{UI_TEXT.finalResults}</h1>

      <div className={styles.winner}>
        <img src={ICONS.crown} alt="" width={54} height={36} />
        <span className={styles.winnerLabel}>{UI_TEXT.winner}</span>
        <span className={styles.winnerNames}>
          {winners.map((winner, index) => (
            <span key={winner.team.id} className={styles.winnerName} title={winner.team.name}>
              {index > 0 && '& '}
              {winner.team.name}
            </span>
          ))}
        </span>
      </div>

      <ol className={styles.standings}>
        {standings.map((standing) => (
          <StandingRow key={standing.team.id} standing={standing} />
        ))}
      </ol>

      {/* Bảng tổng điểm nhiều buổi; vừa reset thì hiện bảng tĩnh (trống) */}
      {session.leaderboard && hasTotals ? <Leaderboard update={session.leaderboard} /> : <TeamTotalsCard />}

      <GemReward amount={session.gemsEarned ?? 0} />

      <div className={styles.actions}>
        <Button color="orange" size="lg" onClick={() => sessionActions.openGift()}>
          {UI_TEXT.openGift}
        </Button>
        <div className={styles.row}>
          <Button color="green" sfx={SFX.UI_START} onClick={() => sessionActions.playAgain()}>
            {UI_TEXT.playAgain}
          </Button>
          <Button color="blue" onClick={() => sessionActions.goHome()}>
            {UI_TEXT.home}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StandingRow({ standing }: { standing: Standing }) {
  const { team, result, place } = standing;
  return (
    <li className={clsx(styles.standing, PLACE_CLASS[Math.min(place, 3) - 1])}>
      <span className={styles.place}>{place}</span>
      <img className={styles.standingMascot} src={mascotUrl(team.mascot)} alt="" width={48} height={54} />
      <div className={styles.standingBody}>
        <div className={styles.standingHead}>
          <span className={styles.standingName} title={team.name}>
            {team.name}
          </span>
          <span className={styles.standingScore}>{result.score}</span>
        </div>
        <Stats result={result} compact />
      </div>
    </li>
  );
}

function SoloResults({ session }: { session: ActiveSession }) {
  const [team] = session.teams;
  const result = session.results[0];
  if (!team || !result) return null;
  const best = session.soloBest;

  return (
    <div className={styles.results}>
      <h1 className={styles.title}>{UI_TEXT.yourResults}</h1>

      <div className={styles.soloCard}>
        <img className={styles.soloMascot} src={mascotUrl(team.mascot)} alt="" width={72} height={81} />
        <p className={styles.soloName} title={team.name}>
          {team.name}
        </p>
        <p className={styles.soloScore}>
          {result.score} <small>{UI_TEXT.points}</small>
        </p>
        {best && (
          <p className={clsx(styles.best, best.isNewBest && styles.newBest)}>
            {best.isNewBest ? UI_TEXT.newBest : `${UI_TEXT.best} ${best.best}`} ·{' '}
            {LEVELS[session.settings.levelId].label}
          </p>
        )}
        <Stats result={result} />
        <ul className={styles.wordList}>
          {result.attempts.map((attempt, index) => (
            <li key={index} className={attempt.correct ? styles.correct : styles.wrong}>
              {attempt.word}
              <span aria-label={attempt.correct ? UI_TEXT.correct : UI_TEXT.wrong}>
                {attempt.correct ? '✓' : '✗'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <GemReward amount={session.gemsEarned ?? 0} />
      <PointsSynced sessionId={session.syncId} />

      <div className={styles.row}>
        <Button color="green" size="lg" sfx={SFX.UI_START} onClick={() => sessionActions.playAgain()}>
          {UI_TEXT.playAgain}
        </Button>
        <Button color="blue" size="lg" onClick={() => sessionActions.goHome()}>
          {UI_TEXT.home}
        </Button>
      </div>
    </div>
  );
}

function Stats({ result, compact = false }: { result: TurnResult; compact?: boolean }) {
  const stats = [
    { label: UI_TEXT.correct, value: String(result.correctWords) },
    { label: UI_TEXT.wrong, value: String(result.wrongWords) },
    { label: UI_TEXT.accuracy, value: formatPercent(accuracyOf(result)) },
    { label: UI_TEXT.timeLeft, value: formatTime(result.timeRemainingMs) },
  ];
  return (
    <dl className={clsx(styles.stats, compact && styles.compact)}>
      {stats.map((stat) => (
        <div key={stat.label} className={styles.statsItem}>
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
