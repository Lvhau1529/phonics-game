/**
 * Kết quả: sao (theo câu đúng ngay lần đầu), điểm, số câu đúng ngay, số câu đã nói, kỷ lục mới,
 * "MY MAGIC SENTENCES" (bấm để nghe lại từng câu), kim cương, điểm đồng bộ. Nút: thế giới tiếp theo,
 * chơi lại, chọn thế giới.
 */
import clsx from 'clsx';
import Picture from '@/games/english-explorers/app/components/Picture';
import { useExplorers } from '@/games/english-explorers/app/hooks';
import { ALL_WORLDS, getWorld } from '@/games/english-explorers/content/worlds';
import { englishExplorersActions, nextWorldId } from '@/games/english-explorers/session/store';
import { TEXT } from '@/games/english-explorers/session/text';
import type { ActiveRound } from '@/games/english-explorers/session/types';
import { say } from '@/games/english-explorers/session/voice';
import { GemReward } from '@/modules/gems';
import { PointsSynced } from '@/modules/results';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import styles from '@/games/english-explorers/app/screens/ResultsScreen.module.scss';

export default function ResultsScreen() {
  const round = useExplorers((state) => state.round);
  const outcome = useExplorers((state) => state.outcome);
  if (!round || !outcome) return null;
  const { settings } = round;
  const world = getWorld(settings.world);
  const total = round.records.length;
  const isNewBest =
    round.score > (outcome.previous?.best ?? 0) || outcome.stars > (outcome.previous?.stars ?? 0);
  const next = nextWorldId(settings.world);

  return (
    <div className={styles.results}>
      <p className={styles.world}>{world ? `${world.emoji} ${world.title}` : `🌍 ${TEXT.allWorlds}`}</p>
      <h1 className={styles.title}>
        {TEXT.greatExploring} <span>{settings.name || TEXT.defaultName}!</span>
      </h1>

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
      {isNewBest && settings.world !== ALL_WORLDS && <p className={styles.best}>{TEXT.newBest}</p>}

      <dl className={styles.stats}>
        <Stat label={TEXT.points} value={`⭐ ${round.score}`} />
        <Stat label={TEXT.firstTry} value={`${outcome.firstTry}/${total}`} />
        {settings.speaking && <Stat label={TEXT.spoken} value={`🎤 ${outcome.spoken}/${total}`} />}
      </dl>

      <Sentences round={round} />
      <GemReward amount={outcome.gemsEarned} />
      <PointsSynced sessionId={outcome.syncId} />

      <div className={styles.actions}>
        {next && (
          <Button color="pink" size="lg" onClick={() => englishExplorersActions.playNextWorld()}>
            {TEXT.nextWorld} <Icon name="next" size={24} />
          </Button>
        )}
        <div className={styles.row}>
          <Button color="green" onClick={() => englishExplorersActions.playAgain()}>
            {TEXT.playAgain}
          </Button>
          <Button color="blue" onClick={() => englishExplorersActions.openSetup()}>
            {TEXT.chooseWorld}
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

/** Các câu đã học — bấm để nghe lại */
function Sentences({ round }: { round: ActiveRound }) {
  return (
    <section className={styles.sentences}>
      <h2>{TEXT.mySentences}</h2>
      <ul>
        {round.records.map((record, index) => {
          const { question } = round.questions[index];
          return (
            <li key={record.questionId}>
              <button type="button" onClick={() => say(question.sentence)}>
                <Picture
                  image={'image' in question.picture ? question.picture.image : undefined}
                  emoji={'emoji' in question.picture ? question.picture.emoji : undefined}
                  className={styles.thumb}
                />
                <span className={styles.text}>{question.sentence}</span>
                <span className={styles.marks}>
                  {record.misses === 0 ? '⭐' : '✔️'}
                  {record.spoke && '🎤'}
                  🔊
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
