/**
 * Màn chơi: thanh trên (QUIT, bé, câu x / n, điểm) + tranh + câu hỏi (LISTEN) + 3 đáp án + bước nói.
 *   choose — máy đọc câu hỏi kèm 3 đáp án; chọn sai: đáp án mờ đi + "Try again!", chọn lại
 *   speak  — câu mẫu đầy đủ (máy đọc), HEAR IT, micro SAY IT (máy so câu nghe được với câu mẫu), NEXT
 *            (không có micro: I SAID IT!)
 *   done   — (tắt bước nói) câu mẫu + NEXT
 * Dải LOOK · LISTEN · CHOOSE · SPEAK ở đáy sáng theo bước hiện tại (bản gốc chỉ là chữ tĩnh).
 */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Picture from '@/games/english-explorers/app/components/Picture';
import { useExplorers } from '@/games/english-explorers/app/hooks';
import { worldOf } from '@/games/english-explorers/content/worlds';
import { pointsFor, SCORING, SPEAK_MATCH, spokenPrompt } from '@/games/english-explorers/session/rules';
import { englishExplorersActions } from '@/games/english-explorers/session/store';
import { TEXT } from '@/games/english-explorers/session/text';
import type { ActiveRound, RoundQuestion } from '@/games/english-explorers/session/types';
import { say } from '@/games/english-explorers/session/voice';
import { useSpeechListener } from '@/core/hooks/useSpeechListener';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { speech } from '@/core/utils/speech';
import { matchWords } from '@/core/utils/speechRecognition';
import BackButton from '@/ui/BackButton/BackButton';
import Button from '@/ui/Button/Button';
import Dialog from '@/ui/Dialog/Dialog';
import Icon from '@/ui/Icon/Icon';
import MicButton from '@/ui/MicButton/MicButton';
import { MASCOT } from '@/ui/icons';
import styles from '@/games/english-explorers/app/screens/PlayScreen.module.scss';

const LETTERS = ['A', 'B', 'C'];
/** Khớp thời gian hiệu ứng pop của .panel (PlayScreen.module.scss) */
const REVEAL_DELAY_MS = 280;

export default function PlayScreen() {
  const round = useExplorers((state) => state.round);
  const [quitOpen, setQuitOpen] = useState(false);

  const roundId = round?.id ?? 0;
  const index = round?.index ?? 0;
  // Câu mới -> máy đọc câu hỏi + 3 đáp án
  useEffect(() => {
    const current = round?.questions[index];
    if (current)
      say(
        spokenPrompt(
          current.question.prompt,
          current.options.map((option) => option.label),
        ),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đọc khi sang câu mới
  }, [roundId, index]);

  useEffect(() => () => speech.cancel(), []);

  if (!round) return null;
  const current = round.questions[round.index];
  const world = worldOf(current.question.id);
  const answered = round.phase !== 'choose';
  const step = round.phase === 'choose' ? (round.wrong.length > 0 ? 2 : 1) : 3;

  const choose = (choice: number) => {
    const result = englishExplorersActions.choose(choice);
    if (result === false) {
      playSfx(SFX.WRONG_LETTER);
      say(TEXT.sayTryAgain);
    } else if (result === true) {
      playSfx(SFX.CORRECT_LETTER);
      say(`${TEXT.sayGreat} ${current.question.sentence}`);
    }
  };

  return (
    <div className={clsx(styles.play, answered && styles.answered)}>
      <header className={styles.top}>
        <BackButton label={TEXT.quit} onClick={() => setQuitOpen(true)} />
        <span className={styles.chip}>
          👤 <b>{round.settings.name || TEXT.explorer}</b>
        </span>
        <span className={styles.chip}>
          {TEXT.question} {round.index + 1}/{round.questions.length}
        </span>
        <span className={clsx(styles.chip, styles.score)}>⭐ {round.score}</span>
      </header>

      {world && (
        <h1 className={styles.worldTitle}>
          {world.emoji} {world.title}
        </h1>
      )}

      <div className={styles.card}>
        <div className={styles.picture}>
          <Picture
            image={'image' in current.question.picture ? current.question.picture.image : undefined}
            emoji={'emoji' in current.question.picture ? current.question.picture.emoji : undefined}
            alt={current.question.sentence}
            className={styles.pictureArt}
          />
        </div>

        <div className={styles.quiz}>
          <div className={styles.prompt}>
            <button
              type="button"
              className={styles.listen}
              aria-label={TEXT.listen}
              onClick={() =>
                say(
                  spokenPrompt(
                    current.question.prompt,
                    current.options.map((option) => option.label),
                  ),
                )
              }
            >
              🔊
            </button>
            <PromptText current={current} answered={answered} />
          </div>

          <Options current={current} round={round} onChoose={choose} />

          {round.phase === 'choose' && round.wrong.length > 0 && (
            <p className={styles.tryAgain} role="status">
              {TEXT.tryAgain}
            </p>
          )}
          {round.phase === 'speak' && (
            <SpeakPanel key={`${round.id}-${round.index}`} current={current} round={round} />
          )}
          {round.phase === 'done' && (
            <DonePanel key={`${round.id}-${round.index}`} current={current} round={round} />
          )}
        </div>
      </div>

      <ol className={styles.steps} aria-label="Steps">
        {[TEXT.look, TEXT.listen, TEXT.choose, TEXT.speak].map((label, i) => (
          <li key={label} className={clsx(i <= step && styles.stepOn)}>
            {label}
          </li>
        ))}
      </ol>

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
              <Button color="red" onClick={() => englishExplorersActions.quit()}>
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

/** Câu hỏi; chỗ trống "___" hiện thành ô trống, chọn đúng thì điền đáp án vào */
function PromptText({ current, answered }: { current: RoundQuestion; answered: boolean }) {
  const { prompt } = current.question;
  if (!prompt.includes('___')) return <span className={styles.promptText}>{prompt}</span>;
  const [before, after] = prompt.split('___');
  return (
    <span className={styles.promptText}>
      {before}
      <span className={clsx(styles.blank, answered && styles.filled)}>
        {answered ? current.options[current.answer].label : '___'}
      </span>
      {after}
    </span>
  );
}

function Options({
  current,
  round,
  onChoose,
}: {
  current: RoundQuestion;
  round: ActiveRound;
  onChoose: (index: number) => void;
}) {
  const answered = round.phase !== 'choose';
  // Máy tính: phím 1–3 hoặc A–C
  useEffect(() => {
    if (answered) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const key = event.key.toUpperCase();
      const digit = ['1', '2', '3'].indexOf(key);
      const index = digit >= 0 ? digit : LETTERS.indexOf(key);
      if (index >= 0) onChoose(index);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, onChoose]);

  return (
    <div className={styles.options}>
      {current.options.map((option, index) => {
        const wrong = round.wrong.includes(index);
        const correct = answered && index === current.answer;
        return (
          <button
            key={option.label}
            type="button"
            className={clsx(styles.option, wrong && styles.wrong, correct && styles.correct)}
            disabled={answered || wrong}
            onClick={() => onChoose(index)}
          >
            <span className={styles.letter}>{LETTERS[index]}</span>
            {(option.image || option.emoji) && (
              <Picture image={option.image} emoji={option.emoji} className={styles.optionArt} />
            )}
            <span className={styles.optionLabel}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Khung dưới đáp án: cuộn tới để bé thấy nút (điện thoại màn thấp) */
function useRevealOnMount() {
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

function Gained({ round }: { round: ActiveRound }) {
  return <span className={styles.gained}>+{pointsFor(round.wrong.length)} ⭐</span>;
}

/** Bước nói: câu mẫu + HEAR IT + micro / I SAID IT! */
function SpeakPanel({ current, round }: { current: RoundQuestion; round: ActiveRound }) {
  const listener = useSpeechListener();
  const ref = useRevealOnMount();
  const { sentence } = current.question;
  const micAvailable = listener.supported && listener.status !== 'blocked';
  const matched = listener.transcript ? matchWords(listener.transcript, sentence) >= SPEAK_MATCH : false;
  const last = round.index + 1 >= round.questions.length;

  useEffect(() => {
    if (matched) playSfx(SFX.WORD_COMPLETE);
  }, [matched]);

  let status: string = TEXT.micHint;
  if (listener.status === 'silent') status = TEXT.micSilent;
  if (listener.status === 'blocked') status = TEXT.micBlocked;

  return (
    <div ref={ref} className={styles.panel}>
      <p className={styles.say}>
        {TEXT.sayIt} <Gained round={round} />
      </p>
      <p className={styles.sentence}>“{sentence}”</p>
      <div className={styles.row}>
        <Button color="blue" onClick={() => say(sentence)}>
          🔊 {TEXT.hearModel}
        </Button>
        {micAvailable && (
          <MicButton
            status={listener.status}
            onStart={listener.start}
            onStop={listener.stop}
            labels={{ start: TEXT.micStart, listening: TEXT.micListening, again: TEXT.micAgain }}
          />
        )}
      </div>
      {listener.transcript ? (
        <p className={clsx(styles.heard, matched && styles.matched)} aria-live="polite">
          {TEXT.micHeard} <b>“{listener.transcript}”</b>
          <br />
          {matched ? `🎉 ${TEXT.micGreat} +${SCORING.spoke}` : TEXT.micAlmost}
        </p>
      ) : (
        <p className={styles.micStatus}>{status}</p>
      )}
      <Button
        color={micAvailable ? 'pink' : 'green'}
        size="lg"
        className={styles.mainAction}
        disabled={listener.status === 'listening'}
        sfx={last ? SFX.UI_START : SFX.UI_CLICK}
        onClick={() => {
          listener.stop();
          englishExplorersActions.submitSpeaking(listener.transcript, micAvailable);
        }}
      >
        {micAvailable ? (last ? TEXT.seeResults : TEXT.next) : `✅ ${TEXT.saidIt}`}{' '}
        <Icon name="next" size={24} />
      </Button>
    </div>
  );
}

/** Tắt bước nói: câu mẫu + NEXT */
function DonePanel({ current, round }: { current: RoundQuestion; round: ActiveRound }) {
  const ref = useRevealOnMount();
  const last = round.index + 1 >= round.questions.length;
  return (
    <div ref={ref} className={styles.panel}>
      <p className={styles.say}>
        🎉 {TEXT.sayWellDone} <Gained round={round} />
      </p>
      <p className={styles.sentence}>“{current.question.sentence}”</p>
      <div className={styles.row}>
        <Button color="blue" onClick={() => say(current.question.sentence)}>
          🔊 {TEXT.hearModel}
        </Button>
        <Button
          color="pink"
          size="lg"
          sfx={last ? SFX.UI_START : SFX.UI_CLICK}
          onClick={() => englishExplorersActions.next()}
        >
          {last ? TEXT.seeResults : TEXT.next} <Icon name="next" size={24} />
        </Button>
      </div>
    </div>
  );
}
