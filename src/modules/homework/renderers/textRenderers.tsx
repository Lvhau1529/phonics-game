/**
 * Dạng chữ / từ: MISSING_SOUND (gõ âm thiếu + từ), UNSCRAMBLE_WORD (chạm chữ xếp lại), PICK_LETTERS (chạm chọn
 * các chữ tạo thành từ), WORD_ORDER (chạm từ xếp thành câu), FILL_BLANK_WORD_BANK (chọn từ trong hộp điền chỗ
 * trống), NUMBER_PICTURES (chọn ảnh rồi chạm số / từ).
 */
import { useState } from 'react';
import clsx from 'clsx';
import { blankCount } from '@phonics/contracts';
import AudioButton from '@/modules/homework/components/AudioButton/AudioButton';
import { useMedia } from '@/modules/homework/renderers/mediaContext';
import OnScreenKeyboard from '@/modules/homework/components/OnScreenKeyboard/OnScreenKeyboard';
import {
  ImageTile,
  LetterTile,
  Slot,
  WordChip,
  type TileState,
} from '@/modules/homework/components/tiles/tiles';
import { norm, type RendererProps } from '@/modules/homework/renderers/types';
import styles from '@/modules/homework/renderers/renderers.module.scss';

const wordState = (review: boolean, expected: string | undefined, actual: string): TileState =>
  review && expected ? (norm(expected) === norm(actual) ? 'ok' : 'bad') : undefined;

// ---------- MISSING_SOUND ----------
export function MissingSoundRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'MISSING_SOUND'>) {
  const image = useMedia(config.imageMediaId);
  const review = mode === 'review';
  const blanks = blankCount(config.pattern);
  const letters = Array.from({ length: blanks }, (_, i) => answer?.letters[i] ?? '');
  const word = answer?.word ?? '';
  // Ô đang nhận bàn phím: 'b<i>' = ô trống thứ i, 'w' = từ
  const [target, setTarget] = useState<string>(
    letters.findIndex((l) => !l) === -1 ? 'w' : `b${letters.findIndex((l) => !l)}`,
  );
  const set = (patch: { letters?: string[]; word?: string }) =>
    onChange({ type: 'MISSING_SOUND', letters, word, ...patch });

  const onLetter = (letter: string) => {
    if (target === 'w') return word.length < 20 && set({ word: word + letter });
    const i = Number(target.slice(1));
    const next = [...letters];
    next[i] = letter;
    set({ letters: next });
    const following = next.findIndex((l, j) => j > i && !l);
    setTarget(following === -1 ? 'w' : `b${following}`);
  };
  const onBackspace = () => {
    if (target === 'w') {
      if (word) return set({ word: word.slice(0, -1) });
      const lastFilled = letters
        .map((l, i) => (l ? i : -1))
        .filter((i) => i >= 0)
        .pop();
      if (lastFilled !== undefined) setTarget(`b${lastFilled}`);
      return;
    }
    const i = Number(target.slice(1));
    const next = [...letters];
    next[i] = '';
    set({ letters: next });
  };

  // Chỉ số ô trống của từng đoạn (tính trước khi render JSX)
  const segments = config.pattern.split('-');
  const blankIndexOf: number[] = [];
  let blankSeen = 0;
  for (const segment of segments) blankIndexOf.push(segment.includes('_') ? blankSeen++ : -1);
  return (
    <div className={clsx(styles.col, styles.center)}>
      <div className={styles.hero}>
        {image && <img className={styles.heroImage} src={image.url} alt="" />}
        <AudioButton mediaId={config.audioMediaId} />
      </div>
      <div className={styles.row}>
        {segments.map((segment, i) => {
          const index = blankIndexOf[i];
          if (index >= 0) {
            return (
              <LetterTile
                key={i}
                letter={letters[index]}
                active={!review && target === `b${index}`}
                state={wordState(review, answerKey?.letters[index], letters[index])}
                onClick={review ? undefined : () => setTarget(`b${index}`)}
              />
            );
          }
          return <LetterTile key={i} letter={segment} fixed />;
        })}
      </div>
      <div className={styles.row}>
        <span className={styles.dash}>→</span>
        <Slot
          active={!review && target === 'w'}
          state={wordState(review, answerKey?.word, word)}
          onClick={review ? undefined : () => setTarget('w')}
          wide
        >
          {word || undefined}
        </Slot>
      </div>
      {!review && (
        <OnScreenKeyboard className={styles.keyboard} onLetter={onLetter} onBackspace={onBackspace} />
      )}
    </div>
  );
}

// ---------- UNSCRAMBLE_WORD ----------
/** Suy ra các chỉ số chữ đã dùng từ từ đang ghép (chữ trùng lấy từ trái sang) */
function pickedFromWord(scrambled: string, word: string): number[] {
  const used: number[] = [];
  for (const letter of word.toLowerCase()) {
    const index = scrambled
      .toLowerCase()
      .split('')
      .findIndex((l, i) => l === letter && !used.includes(i));
    if (index === -1) break;
    used.push(index);
  }
  return used;
}

export function UnscrambleWordRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'UNSCRAMBLE_WORD'>) {
  const image = useMedia(config.imageMediaId);
  const review = mode === 'review';
  const word = answer?.word ?? '';
  const [picked, setPicked] = useState<number[]>(() => pickedFromWord(config.scrambled, word));
  const apply = (next: number[]) => {
    setPicked(next);
    onChange({ type: 'UNSCRAMBLE_WORD', word: next.map((i) => config.scrambled[i]).join('') });
  };
  const state = wordState(review, answerKey?.word, word);
  return (
    <div className={clsx(styles.col, styles.center)}>
      {image && <img className={styles.heroImage} src={image.url} alt="" />}
      <div className={styles.row}>
        {config.scrambled.split('').map((letter, i) => (
          <WordChip key={i} used={picked.includes(i)} disabled={review} onClick={() => apply([...picked, i])}>
            {letter}
          </WordChip>
        ))}
      </div>
      <div className={styles.row}>
        {(review ? word.split('') : picked.map((i) => config.scrambled[i])).map((letter, i) => (
          <LetterTile
            key={i}
            letter={letter}
            state={state}
            onClick={review ? undefined : () => apply(picked.slice(0, i))}
          />
        ))}
        {!review && picked.length < config.scrambled.length && <LetterTile letter="" active />}
      </div>
      {!review && picked.length > 0 && <WordChip onClick={() => apply([])}>CLEAR</WordChip>}
    </div>
  );
}

// ---------- PICK_LETTERS ----------
export function PickLettersRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'PICK_LETTERS'>) {
  const image = useMedia(config.imageMediaId);
  const review = mode === 'review';
  const ids = answer?.letterIds ?? [];
  const word = answer?.word ?? '';
  const letterOf = (id: string) => config.letters.find((l) => l.id === id)?.letter ?? '';
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    onChange({ type: 'PICK_LETTERS', letterIds: next, word: next.map(letterOf).join('') });
  };
  const state = wordState(review, answerKey?.word, word);
  return (
    <div className={clsx(styles.col, styles.center)}>
      {image && <img className={styles.heroImage} src={image.url} alt="" />}
      <div className={styles.row}>
        {config.letters.map((item) => (
          <WordChip
            key={item.id}
            selected={ids.includes(item.id)}
            state={
              review && answerKey
                ? answerKey.letterIds.includes(item.id)
                  ? 'ok'
                  : ids.includes(item.id)
                    ? 'bad'
                    : undefined
                : undefined
            }
            disabled={review}
            onClick={() => toggle(item.id)}
          >
            {item.letter}
          </WordChip>
        ))}
      </div>
      <div className={styles.row}>
        <span className={styles.dash}>→</span>
        <Slot state={state} wide>
          {word || undefined}
        </Slot>
      </div>
    </div>
  );
}

// ---------- WORD_ORDER ----------
export function WordOrderRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'WORD_ORDER'>) {
  const image = useMedia(config.imageMediaId);
  const review = mode === 'review';
  const order = answer?.order ?? [];
  const set = (next: number[]) => onChange({ type: 'WORD_ORDER', order: next });
  const correct =
    review && answerKey ? answerKey.accepted.some((a) => a.join(',') === order.join(',')) : undefined;
  const state: TileState = correct === undefined ? undefined : correct ? 'ok' : 'bad';
  return (
    <div className={clsx(styles.col, styles.center)}>
      {image && <img className={styles.heroImage} src={image.url} alt="" />}
      <div className={styles.row}>
        {order.map((index, position) => (
          <WordChip
            key={`${index}-${position}`}
            state={state}
            disabled={review}
            onClick={() => set(order.filter((_, p) => p !== position))}
          >
            {config.words[index]}
          </WordChip>
        ))}
        {!review && order.length < config.words.length && <Slot active />}
        {config.endPunctuation && <span className={styles.learn}>{config.endPunctuation}</span>}
      </div>
      {!review && (
        <div className={styles.bank}>
          {config.words.map((word, index) => (
            <WordChip key={index} used={order.includes(index)} onClick={() => set([...order, index])}>
              {word}
            </WordChip>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- FILL_BLANK_WORD_BANK ----------
const BLANK = '___';

export function FillBlankRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'FILL_BLANK_WORD_BANK'>) {
  const review = mode === 'review';
  const blanks = answer?.blanks ?? [];
  const valueOf = (sentenceId: string, index: number) =>
    blanks.find((b) => b.sentenceId === sentenceId && b.index === index)?.word ?? '';
  const keyOf = (sentenceId: string, index: number) =>
    answerKey?.blanks.find((b) => b.sentenceId === sentenceId && b.index === index)?.word;
  // Chỗ trống đang chọn; mặc định chỗ trống đầu tiên còn trống
  const slots = config.sentences.flatMap((s) =>
    Array.from({ length: s.text.split(BLANK).length - 1 }, (_, index) => ({ sentenceId: s.id, index })),
  );
  const firstEmpty = slots.find((s) => !valueOf(s.sentenceId, s.index)) ?? null;
  const [active, setActive] = useState<{ sentenceId: string; index: number } | null>(firstEmpty);
  const isActive = (sentenceId: string, index: number) =>
    active?.sentenceId === sentenceId && active.index === index;

  const fill = (word: string) => {
    const slot = active ?? firstEmpty;
    if (!slot) return;
    const next = [
      ...blanks.filter((b) => !(b.sentenceId === slot.sentenceId && b.index === slot.index)),
      { ...slot, word },
    ];
    onChange({ type: 'FILL_BLANK_WORD_BANK', blanks: next });
    const after = slots.find((s) => !next.some((b) => b.sentenceId === s.sentenceId && b.index === s.index));
    setActive(after ?? null);
  };
  const clear = (sentenceId: string, index: number) => {
    onChange({
      type: 'FILL_BLANK_WORD_BANK',
      blanks: blanks.filter((b) => !(b.sentenceId === sentenceId && b.index === index)),
    });
    setActive({ sentenceId, index });
  };
  const usedWords = blanks.map((b) => b.word);

  return (
    <div className={styles.col}>
      {!review && (
        <div className={styles.bank}>
          {config.wordBank.map((word, i) => (
            <WordChip
              key={`${word}-${i}`}
              used={
                usedWords.filter((w) => w === word).length >= config.wordBank.filter((w) => w === word).length
              }
              onClick={() => fill(word)}
            >
              {word}
            </WordChip>
          ))}
        </div>
      )}
      {config.sentences.map((sentence) => (
        <SentenceRow key={sentence.id} sentence={sentence}>
          {sentence.text.split(BLANK).map((part, index, parts) => (
            <span key={index} style={{ display: 'contents' }}>
              <span>{part}</span>
              {index < parts.length - 1 && (
                <Slot
                  active={!review && isActive(sentence.id, index)}
                  state={wordState(review, keyOf(sentence.id, index), valueOf(sentence.id, index))}
                  onClick={
                    review
                      ? undefined
                      : () =>
                          valueOf(sentence.id, index)
                            ? clear(sentence.id, index)
                            : setActive({ sentenceId: sentence.id, index })
                  }
                >
                  {valueOf(sentence.id, index) || undefined}
                </Slot>
              )}
            </span>
          ))}
        </SentenceRow>
      ))}
    </div>
  );
}

function SentenceRow({
  sentence,
  children,
}: {
  sentence: { imageMediaId?: string };
  children: React.ReactNode;
}) {
  const image = useMedia(sentence.imageMediaId);
  return (
    <div className={styles.hero} style={{ justifyContent: 'flex-start' }}>
      {image && <img src={image.url} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} />}
      <p className={styles.sentence}>{children}</p>
    </div>
  );
}

// ---------- NUMBER_PICTURES ----------
export function NumberPicturesRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'NUMBER_PICTURES'>) {
  const review = mode === 'review';
  const numbers = answer?.numbers ?? [];
  const words = answer?.words ?? [];
  const numberOf = (imageId: string) => numbers.find((n) => n.imageId === imageId)?.number ?? null;
  const wordOf = (imageId: string) => words.find((w) => w.imageId === imageId)?.word ?? '';
  const [selected, setSelected] = useState<string | null>(
    config.images.find((img) => numberOf(img.id) === null)?.id ?? null,
  );
  const emit = (patch: { numbers?: typeof numbers; words?: typeof words }) =>
    onChange({ type: 'NUMBER_PICTURES', numbers, words: config.writeWord ? words : undefined, ...patch });

  const assign = (number: number) => {
    if (!selected) return;
    const next = [...numbers.filter((n) => n.imageId !== selected), { imageId: selected, number }];
    emit({ numbers: next });
    if (!config.writeWord)
      setSelected(config.images.find((img) => !next.some((n) => n.imageId === img.id))?.id ?? null);
  };
  const typeWord = (word: string) => {
    if (!selected) return;
    emit({ words: [...words.filter((w) => w.imageId !== selected), { imageId: selected, word }] });
  };
  const keyNumber = (imageId: string) => answerKey?.numbers.find((n) => n.imageId === imageId)?.number;
  const usedNumbers = numbers.map((n) => n.number);

  return (
    <div className={clsx(styles.col, styles.center)}>
      <div className={styles.hero}>
        <AudioButton mediaId={config.audioMediaId} size="lg" label="Listen" />
      </div>
      {config.showWordBank && (
        <div className={styles.bank}>
          {config.words.map((item) => (
            <span key={item.number} className={styles.bankItem}>
              <b>{item.number}.</b> {item.word}
            </span>
          ))}
        </div>
      )}
      <div className={styles.row}>
        {config.images.map((img) => {
          const number = numberOf(img.id);
          const key = keyNumber(img.id);
          return (
            <ImageTile
              key={img.id}
              mediaId={img.mediaId}
              corner={number}
              label={config.writeWord ? wordOf(img.id) || (review ? '' : '…') : undefined}
              selected={!review && selected === img.id}
              state={review && key !== undefined ? (key === number ? 'ok' : 'bad') : undefined}
              disabled={review}
              onClick={review ? undefined : () => setSelected(img.id)}
            />
          );
        })}
      </div>
      {!review && (
        <>
          <div className={styles.row}>
            {config.words.map((item) => (
              <WordChip
                key={item.number}
                used={usedNumbers.includes(item.number)}
                disabled={!selected}
                onClick={() => assign(item.number)}
              >
                {item.number}
              </WordChip>
            ))}
          </div>
          {!selected && <p className={styles.hint}>TAP A PICTURE, THEN TAP A NUMBER</p>}
          {config.writeWord && selected && (
            <OnScreenKeyboard
              className={styles.keyboard}
              onLetter={(letter) => wordOf(selected).length < 20 && typeWord(wordOf(selected) + letter)}
              onBackspace={() => typeWord(wordOf(selected).slice(0, -1))}
              onDone={() => setSelected(config.images.find((img) => numberOf(img.id) === null)?.id ?? null)}
            />
          )}
        </>
      )}
    </div>
  );
}
