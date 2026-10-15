/**
 * Màn chơi: thanh trên (QUIT, câu x / n, đồng hồ câu, điểm) + 4 hình + bước hiện tại:
 *   choose — "Which one is different?" (máy đọc; LISTEN để nghe lại cả 4 tên hình)
 *   speak  — khung câu "I think the ___ is different because ...", micro (nếu có), I'VE SPOKEN!
 *   answer — đúng / sai, hình khác loại, nhóm của 3 hình còn lại, câu mẫu (máy đọc), NEXT
 * QUIT mở hộp xác nhận (bản gốc dùng confirm() của trình duyệt).
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import clsx from 'clsx';
import OptionArt from '@/games/odd-one-out/app/components/OptionArt';
import PuzzleTiles from '@/games/odd-one-out/app/components/PuzzleTiles';
import PuzzleTimer from '@/games/odd-one-out/app/components/PuzzleTimer';
import { useOddOneOut } from '@/games/odd-one-out/app/hooks';
import { getTopic } from '@/games/odd-one-out/content/puzzles';
import { levelLabel, SCORING } from '@/games/odd-one-out/session/rules';
import { oddOneOutActions } from '@/games/odd-one-out/session/store';
import { TEXT } from '@/games/odd-one-out/session/text';
import type { ActiveRound, PuzzleRecord, RoundPuzzle } from '@/games/odd-one-out/session/types';
import { say } from '@/games/odd-one-out/session/voice';
import { useSpeechListener } from '@/core/hooks/useSpeechListener';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { speech } from '@/core/utils/speech';
import BackButton from '@/ui/BackButton/BackButton';
import Button from '@/ui/Button/Button';
import Dialog from '@/ui/Dialog/Dialog';
import Icon from '@/ui/Icon/Icon';
import MicButton from '@/ui/MicButton/MicButton';
import { MASCOT } from '@/ui/icons';
import styles from '@/games/odd-one-out/app/screens/PlayScreen.module.scss';

/** Khớp thời gian hiệu ứng pop của .panel (PlayScreen.module.scss) */
const REVEAL_DELAY_MS = 280;

export default function PlayScreen() {
  const round = useOddOneOut((state) => state.round);
  const [quitOpen, setQuitOpen] = useState(false);
  const choose = useCallback((index: number) => oddOneOutActions.choose(index), []);

  // Câu mới -> máy đọc câu hỏi
  const index = round?.index ?? 0;
  const roundId = round?.id ?? 0;
  useEffect(() => {
    say(TEXT.sayQuestion);
  }, [roundId, index]);

  useEffect(() => () => speech.cancel(), []);

  if (!round) return null;
  const current = round.puzzles[round.index];
  const record = round.phase === 'answer' ? round.records[round.records.length - 1] : undefined;

  return (
    <div className={styles.play}>
      <header className={styles.top}>
        <BackButton label={TEXT.quit} onClick={() => setQuitOpen(true)} />
        <Progress round={round} />
        <PuzzleTimer startedAt={round.puzzleStartedAt} stoppedMs={record?.ms ?? null} />
        <span className={styles.score} aria-label={`${round.score} ${TEXT.points}`}>
          ⭐ {round.score}
        </span>
      </header>

      <section className={styles.stage}>
        <div className={styles.tags}>
          <span className={styles.tag}>
            {getTopic(current.puzzle.topic).emoji} {getTopic(current.puzzle.topic).title}
          </span>
          <span className={clsx(styles.tag, styles.levelTag)}>{levelLabel(current.puzzle.level)}</span>
        </div>

        {round.phase === 'choose' && (
          <StepTitle
            kicker={TEXT.stepLook}
            title={TEXT.whichDifferent}
            sub={TEXT.tapOdd}
            onListen={() =>
              say(`${TEXT.sayQuestion} ${current.options.map((option) => option.name).join(', ')}.`)
            }
          />
        )}
        {round.phase === 'speak' && (
          <StepTitle
            kicker={TEXT.stepSpeak}
            title={TEXT.tellWhy}
            sub={TEXT.changeChoice}
            onListen={() => say(sentenceFrame(current, round.selected))}
          />
        )}
        {round.phase === 'answer' && record && <AnswerTitle record={record} />}

        <PuzzleTiles
          current={current}
          selected={round.selected}
          revealed={round.phase === 'answer'}
          compact={round.phase !== 'choose'}
          onChoose={(choice) => {
            const name = current.options[choice].name;
            // Lần chọn đầu khi có bước nói: đọc tên hình rồi mời bé nói luôn (đọc tách hai lần thì câu sau cắt câu trước)
            const invite = round.phase === 'choose' && round.settings.speaking;
            say(invite ? `${name}! ${TEXT.sayYourTurn}` : name);
            choose(choice);
          }}
        />

        {round.phase === 'speak' && <SpeakPanel key={`${round.id}-${round.index}`} round={round} />}
        {round.phase === 'answer' && record && (
          <AnswerPanel key={`${round.id}-${round.index}`} current={current} record={record} round={round} />
        )}
      </section>

      {quitOpen && (
        <Dialog
          title={TEXT.quitTitle}
          image={MASCOT.encourage}
          onClose={() => setQuitOpen(false)}
          actions={
            <>
              <Button color="green" onClick={() => setQuitOpen(false)}>
                {TEXT.quitNo}
              </Button>
              <Button color="red" onClick={() => oddOneOutActions.quit()}>
                {TEXT.quitYes}
              </Button>
            </>
          }
        >
          <p>{TEXT.quitBody}</p>
        </Dialog>
      )}
    </div>
  );
}

function Progress({ round }: { round: ActiveRound }) {
  const total = round.puzzles.length;
  const done = round.records.length;
  return (
    <div className={styles.progress}>
      <span className={styles.progressLabel}>
        {TEXT.puzzle} {round.index + 1}/{total}
      </span>
      <span
        className={styles.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <span className={styles.fill} style={{ width: `${(done / total) * 100}%` }} />
      </span>
    </div>
  );
}

function StepTitle({
  kicker,
  title,
  sub,
  onListen,
}: {
  kicker: string;
  title: string;
  sub: string;
  onListen: () => void;
}) {
  return (
    <div className={styles.stepTitle}>
      <span className={styles.kicker}>{kicker}</span>
      <h1>{title}</h1>
      <p className={styles.sub}>{sub}</p>
      <button type="button" className={styles.listen} onClick={onListen} aria-label={TEXT.listen}>
        🔊 {TEXT.listen}
      </button>
    </div>
  );
}

const sentenceFrame = (current: RoundPuzzle, selected: number | null) =>
  TEXT.sentenceFrame(selected === null ? '___' : current.options[selected].name);

/** Bước nói: khung câu + micro (nếu trình duyệt có) + I'VE SPOKEN! */
/** Khung bước nói / đáp án hiện ra dưới 4 hình: cuộn tới để bé thấy nút (điện thoại màn thấp) */
function useRevealOnMount(): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Chờ hiệu ứng pop (scale) xong mới đo vị trí, không thì cuộn thiếu
    const timer = window.setTimeout(
      () => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      REVEAL_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);
  return ref;
}

function SpeakPanel({ round }: { round: ActiveRound }) {
  const listener = useSpeechListener();
  const ref = useRevealOnMount();
  const current = round.puzzles[round.index];
  const micAvailable = listener.supported && listener.status !== 'blocked';
  const status =
    listener.status === 'heard'
      ? null
      : listener.status === 'silent'
        ? TEXT.micSilent
        : listener.status === 'blocked'
          ? TEXT.micBlocked
          : TEXT.micHint;

  return (
    <div ref={ref} className={styles.panel}>
      <p className={styles.frame}>💭 “{sentenceFrame(current, round.selected)}”</p>
      {listener.supported && (
        <MicButton
          status={listener.status}
          onStart={listener.start}
          onStop={listener.stop}
          labels={{ start: TEXT.micStart, listening: TEXT.micListening, again: TEXT.micAgain }}
        />
      )}
      {listener.transcript ? (
        <p className={styles.heard} aria-live="polite">
          {TEXT.micHeard} <b>“{listener.transcript}”</b>
        </p>
      ) : (
        status && <p className={styles.micStatus}>{listener.supported ? status : TEXT.micHint}</p>
      )}
      <Button
        color="green"
        size="lg"
        className={styles.mainAction}
        disabled={listener.status === 'listening'}
        onClick={() => {
          listener.stop();
          oddOneOutActions.submitSpeaking(listener.transcript, micAvailable);
        }}
      >
        ✅ {TEXT.spoken}
      </Button>
    </div>
  );
}

function AnswerTitle({ record }: { record: PuzzleRecord }) {
  return (
    <div className={styles.stepTitle}>
      <span className={styles.kicker}>{TEXT.stepAnswer}</span>
      <h1 className={record.correct ? styles.great : styles.goodTry}>
        {record.correct ? `🎉 ${TEXT.great}` : `💖 ${TEXT.goodTry}`}
      </h1>
    </div>
  );
}

/** Đáp án: hình khác loại + nhóm của 3 hình còn lại + câu mẫu (máy đọc) */
function AnswerPanel({
  current,
  record,
  round,
}: {
  current: RoundPuzzle;
  record: PuzzleRecord;
  round: ActiveRound;
}) {
  const odd = current.options[current.odd];
  const last = round.index + 1 >= round.puzzles.length;
  const ref = useRevealOnMount();

  useEffect(() => {
    playSfx(record.correct ? SFX.CORRECT_LETTER : SFX.WRONG_LETTER);
    const timer = window.setTimeout(
      () => say(`${record.correct ? TEXT.sayGreat : TEXT.sayGoodTry} ${current.puzzle.sample}`),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [current, record]);

  return (
    <div ref={ref} className={styles.panel}>
      <p className={styles.answer}>
        {TEXT.correctAnswer} <OptionArt option={odd} className={styles.answerArt} /> <b>{odd.name}</b>
      </p>
      <p className={styles.sample}>“{current.puzzle.sample}”</p>
      <p className={styles.group}>
        🔎 {TEXT.otherThree} <b>{current.puzzle.group}</b>
      </p>
      <p className={styles.gained}>
        {record.correct && <span>+{SCORING.correct} ⭐</span>}
        {record.spoke && (
          <span>
            +{SCORING.spoke} 🎤 {TEXT.speakBonus}
          </span>
        )}
      </p>
      <div className={styles.answerActions}>
        <Button color="blue" onClick={() => say(current.puzzle.sample)}>
          🔊 {TEXT.listenAnswer}
        </Button>
        <Button
          color="pink"
          size="lg"
          sfx={last ? SFX.UI_START : SFX.UI_CLICK}
          className={styles.mainAction}
          onClick={() => oddOneOutActions.next()}
        >
          {last ? TEXT.seeResults : TEXT.next} <Icon name="next" size={24} />
        </Button>
      </div>
    </div>
  );
}
