/**
 * Thử thách từ vựng phủ lên bản đồ (spec §6): chủ nhà hỏi, bé nghe / nhìn rồi chạm.
 *   listen_choose — nghe "Find the ...!", chạm 1 trong 2–3 thẻ hình (không cần đọc chữ)
 *   find_object   — chạm đúng vật trong một góc cảnh Halloween (vật là sprite riêng, vùng chạm lớn)
 *   look_listen   — nhìn 1 hình lớn, bấm từng loa để nghe, PICK loa đọc đúng
 *   match_pairs   — chạm hình rồi chạm loa để ghép 2 cặp; đủ 2 cặp thì kiểm tra cả thử thách
 * Sai lần 1: "Try again!", đọc lại yêu cầu (gợi ý nhẹ, không lộ đáp án). Sai lần 2 / hết giờ: hiện đáp án, đọc lại từ.
 * Đồng hồ (nếu bật) chỉ chạy sau khi máy đọc xong yêu cầu lần đầu, dừng khi Pause.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import WordPicture from '@/games/halloween-candy-quest/app/components/WordPicture';
import { backgroundUrl, npcUrl } from '@/games/halloween-candy-quest/app/assets';
import type { VocabWord } from '@/games/halloween-candy-quest/content/words';
import { ZONES } from '@/games/halloween-candy-quest/content/world';
import { halloweenActions } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import type {
  ChoiceQuestion,
  Game,
  MatchQuestion,
  Question,
} from '@/games/halloween-candy-quest/session/types';
import { say } from '@/games/halloween-candy-quest/session/voice';
import styles from '@/games/halloween-candy-quest/app/components/QuestionPanel.module.scss';

/** Ký hiệu + màu phân biệt các loa (không chỉ dựa vào màu — spec §13.3) */
const SPEAKERS = [
  { mark: '★', color: '#ff8a1f' },
  { mark: '●', color: '#3f8cff' },
  { mark: '▲', color: '#22b07d' },
] as const;
/** Vị trí vật trong cảnh Find the Object (% khung cảnh) */
const SCENE_SLOTS = [
  { x: 20, y: 58 },
  { x: 46, y: 34 },
  { x: 70, y: 62 },
  { x: 86, y: 30 },
] as const;

const promptOf = (question: Question, target: VocabWord): string => {
  if (question.type === 'look_listen') return TEXT.lookAndListen;
  if (question.type === 'match_pairs') return TEXT.matchHint;
  return TEXT.findThe(target.text);
};

/** Câu máy đọc: dạng cần nghe tên vật thì đọc tên, Look & Listen / Match chỉ đọc lệnh */
const spokenOf = (question: Question, target: VocabWord): string => {
  if (question.type === 'look_listen') return 'Look! Listen and choose!';
  if (question.type === 'match_pairs') return 'Listen and match!';
  return `Find the ${target.text}!`;
};

export default function QuestionPanel({ game }: { game: Game }) {
  const planned = game.plan[game.turn];
  const { question } = planned;
  const words = new Map(game.words.map((word) => [word.id, word]));
  const word = (id: string): VocabWord => words.get(id) ?? game.words[0];
  const target = word(question.targetId);
  const voiceMode = game.settings.voiceMode;
  const active = game.phase === 'question' && !game.paused;
  /** Câu đã được đọc xong yêu cầu lần đầu (đồng hồ bắt đầu chạy từ đó) */
  const [promptDone, setPromptDone] = useState<string | null>(null);
  const speak = (text: string, onEnd?: () => void) => say(text, voiceMode, { onEnd });

  // Câu mới / lần thử 2 -> đọc yêu cầu (lần 2 thêm "Try again!")
  useEffect(() => {
    if (game.phase !== 'question') return;
    const text = spokenOf(question, target);
    speak(game.attempt > 1 ? `Try again! ${text}` : text, () => setPromptDone(question.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đọc khi sang câu / lần thử mới
  }, [question.id, game.attempt]);

  // Phản hồi bằng giọng
  useEffect(() => {
    if (game.feedback === 'correct') speak(`Great job! ${target.text}!`);
    if (game.feedback === 'wrong') speak('Try again!');
    if (game.feedback === 'reveal') speak(`This is the ${target.text}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đọc khi phản hồi đổi
  }, [game.feedback]);

  const answer = (id: string) => halloweenActions.answer(planned.turnId, id);
  const teacherLine = !game.canSpeak && question.type !== 'look_listen' && question.type !== 'match_pairs';

  return (
    <div className={styles.backdrop}>
      <section className={clsx(styles.panel, game.feedback && styles[game.feedback])} aria-live="polite">
        <header className={styles.head}>
          <img className={styles.npc} src={npcUrl(ZONES[planned.zone].houses[planned.house].npc)} alt="" />
          <div className={styles.bubble}>
            {teacherLine && <span className={styles.teacher}>{TEXT.teacherSays}</span>}
            <span className={clsx(styles.prompt, teacherLine && styles.big)}>
              {promptOf(question, target)}
            </span>
          </div>
          {game.canSpeak && (
            <button
              type="button"
              className={styles.replay}
              aria-label={TEXT.replay}
              title={TEXT.replay}
              onClick={() => speak(spokenOf(question, target))}
            >
              🔊
            </button>
          )}
        </header>

        {question.type === 'match_pairs' ? (
          <MatchBody
            key={`${question.id}-${game.attempt}`}
            game={game}
            question={question}
            word={word}
            speak={speak}
          />
        ) : question.type === 'look_listen' ? (
          <LookListenBody
            key={`${question.id}-${game.attempt}`}
            game={game}
            question={question}
            word={word}
            speak={speak}
            onPick={answer}
          />
        ) : (
          <ChoiceBody
            key={`${question.id}-${game.attempt}`}
            game={game}
            question={question}
            word={word}
            onPick={answer}
          />
        )}

        <FeedbackLine game={game} target={target} />
        {game.settings.timerSeconds > 0 && (
          <Timer
            key={question.id}
            seconds={game.settings.timerSeconds}
            running={active && (promptDone === question.id || !game.canSpeak)}
            onTimeUp={() => halloweenActions.timeUp(planned.turnId)}
          />
        )}
      </section>
    </div>
  );
}

function FeedbackLine({ game, target }: { game: Game; target: VocabWord }) {
  if (!game.feedback) return <p className={styles.feedback}>&nbsp;</p>;
  const text =
    game.feedback === 'correct'
      ? `🎉 ${TEXT.greatJob}`
      : game.feedback === 'wrong'
        ? `💫 ${TEXT.tryAgain}`
        : `👉 ${TEXT.thisIs(target.text)}`;
  return <p className={clsx(styles.feedback, styles.feedbackOn)}>{text}</p>;
}

/** Trạng thái của một lựa chọn sau khi chạm: đúng sáng xanh, sai rung nhẹ, hiện đáp án thì khoanh đáp án */
function optionState(game: Game, picked: string | null, id: string, targetId: string): string | undefined {
  if (game.feedback === 'correct' && id === targetId) return styles.right;
  if (game.feedback === 'reveal' && id === targetId) return styles.reveal;
  if (game.feedback && id === picked && id !== targetId) return styles.miss;
  return undefined;
}

interface ChoiceBodyProps {
  game: Game;
  question: ChoiceQuestion;
  word: (id: string) => VocabWord;
  onPick: (id: string) => void;
}

/** Listen & Choose (thẻ hình) và Find the Object (vật trong cảnh) */
function ChoiceBody({ game, question, word, onPick }: ChoiceBodyProps) {
  // Lần thử mới thì component được dựng lại (key theo lần thử) -> bỏ đánh dấu lựa chọn cũ
  const [picked, setPicked] = useState<string | null>(null);
  const enabled = game.phase === 'question' && !game.paused;
  const pick = (id: string) => {
    if (!enabled) return;
    setPicked(id);
    onPick(id);
  };
  const reveal = game.feedback === 'reveal' || game.feedback === 'correct';

  if (question.type === 'find_object') {
    const zone = ZONES[game.plan[game.turn].zone];
    return (
      <div className={styles.scene} style={{ backgroundImage: `url(${backgroundUrl(zone.id)})` }}>
        {question.options.map((id, index) => {
          const slot = SCENE_SLOTS[index % SCENE_SLOTS.length];
          return (
            <button
              key={id}
              type="button"
              className={clsx(styles.object, optionState(game, picked, id, question.targetId))}
              style={
                { left: `${slot.x}%`, top: `${slot.y}%`, animationDelay: `${index * 0.3}s` } as CSSProperties
              }
              disabled={!enabled}
              aria-label={reveal ? word(id).text : `Object ${index + 1}`}
              onClick={() => pick(id)}
            >
              <WordPicture word={word(id)} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.cards} data-count={question.options.length}>
      {question.options.map((id, index) => (
        <button
          key={id}
          type="button"
          className={clsx(styles.card, optionState(game, picked, id, question.targetId))}
          disabled={!enabled}
          aria-label={reveal ? word(id).text : `Picture ${index + 1}`}
          onClick={() => pick(id)}
        >
          <WordPicture word={word(id)} className={styles.cardArt} />
          {reveal && id === question.targetId && <span className={styles.label}>{word(id).text}</span>}
        </button>
      ))}
    </div>
  );
}

interface LookListenProps extends ChoiceBodyProps {
  speak: (text: string) => void;
}

/** Look & Listen: 1 hình lớn + 2–3 loa; chạm loa để nghe, PICK để chọn */
function LookListenBody({ game, question, word, speak, onPick }: LookListenProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const enabled = game.phase === 'question' && !game.paused;
  const reveal = game.feedback === 'reveal' || game.feedback === 'correct';
  return (
    <div className={styles.lookListen}>
      <div className={styles.bigPicture}>
        <WordPicture word={word(question.targetId)} />
      </div>
      <div className={styles.speakers}>
        {question.options.map((id, index) => {
          const speaker = SPEAKERS[index];
          return (
            <div
              key={id}
              className={clsx(styles.speakerCard, optionState(game, picked, id, question.targetId))}
              style={{ '--speaker': speaker.color } as CSSProperties}
            >
              <button
                type="button"
                className={clsx(styles.speaker, playing === id && styles.playing)}
                aria-label={`Sound ${speaker.mark}`}
                disabled={game.paused}
                onClick={() => {
                  setPlaying(id);
                  speak(word(id).text);
                }}
              >
                <span aria-hidden="true">🔊</span>
                <span className={styles.mark}>{speaker.mark}</span>
              </button>
              <button
                type="button"
                className={styles.pick}
                disabled={!enabled}
                onClick={() => {
                  setPicked(id);
                  onPick(id);
                }}
              >
                {TEXT.pick}
              </button>
              {reveal && id === question.targetId && <span className={styles.label}>{word(id).text}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MatchBodyProps {
  game: Game;
  question: MatchQuestion;
  word: (id: string) => VocabWord;
  speak: (text: string) => void;
}

/** Match the Pairs: chạm hình (chọn) rồi chạm loa (nghe + ghép). Chạm lại hình đã ghép để gỡ. */
function MatchBody({ game, question, word, speak }: MatchBodyProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const checked = useRef(false);
  const enabled = game.phase === 'question' && !game.paused;
  const turnId = game.plan[game.turn].turnId;
  const showAnswer = game.feedback === 'reveal';
  const pairIndex = (imageId: string) => question.options.indexOf(imageId);

  // Ghép đủ 2 cặp -> kiểm tra cả thử thách (một lần)
  useEffect(() => {
    if (checked.current || Object.keys(pairs).length < question.options.length) return undefined;
    const timer = window.setTimeout(() => {
      checked.current = true;
      halloweenActions.answerPairs(turnId, pairs);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [pairs, question.options.length, turnId]);

  const soundOwner = (soundId: string) => Object.keys(pairs).find((imageId) => pairs[imageId] === soundId);

  return (
    <div className={styles.match}>
      <div className={styles.column}>
        {question.options.map((id) => {
          const paired = id in pairs;
          const tone = paired || showAnswer ? pairIndex(id) : -1;
          return (
            <button
              key={id}
              type="button"
              className={clsx(
                styles.matchImage,
                selected === id && styles.selected,
                tone >= 0 && styles[`pair${tone}`],
              )}
              disabled={!enabled}
              aria-label={`Picture ${pairIndex(id) + 1}`}
              onClick={() => {
                if (paired) {
                  const next = { ...pairs };
                  delete next[id];
                  setPairs(next);
                }
                setSelected(id);
              }}
            >
              <WordPicture word={word(id)} />
            </button>
          );
        })}
      </div>
      <span className={styles.link} aria-hidden="true">
        ⇄
      </span>
      <div className={styles.column}>
        {question.sounds.map((id, index) => {
          const owner = showAnswer ? id : soundOwner(id);
          const tone = owner ? pairIndex(owner) : -1;
          const speaker = SPEAKERS[index];
          return (
            <button
              key={id}
              type="button"
              className={clsx(styles.matchSound, tone >= 0 && styles[`pair${tone}`])}
              style={{ '--speaker': speaker.color } as CSSProperties}
              disabled={game.paused}
              aria-label={`Sound ${speaker.mark}`}
              onClick={() => {
                speak(word(id).text);
                if (!enabled || !selected) return;
                // Loa này đang ghép với hình khác -> chuyển sang hình vừa chọn
                const next = Object.fromEntries(Object.entries(pairs).filter(([, sound]) => sound !== id));
                setPairs({ ...next, [selected]: id });
                setSelected(null);
              }}
            >
              <span aria-hidden="true">🔊</span>
              <span className={styles.mark}>{speaker.mark}</span>
              {showAnswer && <span className={styles.label}>{word(id).text}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Thanh thời gian (tuỳ chọn 30 / 45 giây) — hết giờ: hiện đáp án, 0 kẹo, không báo động */
function Timer({ seconds, running, onTimeUp }: { seconds: number; running: boolean; onTimeUp: () => void }) {
  const [left, setLeft] = useState(seconds * 1000);
  const callback = useRef(onTimeUp);
  useEffect(() => {
    callback.current = onTimeUp;
  });
  useEffect(() => {
    if (!running) return undefined;
    const started = Date.now();
    const from = left;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, from - (Date.now() - started));
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        callback.current();
      }
    }, 200);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chạy tiếp từ thời gian còn lại khi bỏ Pause
  }, [running]);
  return (
    <div className={styles.timer} role="timer" aria-label={`${Math.ceil(left / 1000)}s`}>
      <span style={{ width: `${(left / (seconds * 1000)) * 100}%` }} />
    </div>
  );
}
