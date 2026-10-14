/**
 * Dạng chọn (chạm một lần): MULTIPLE_CHOICE (thẻ chữ), ODD_ONE_OUT (gạch chéo ảnh lạc loài),
 * PATTERN_NEXT (chuỗi hình → chọn hình tiếp theo, có thể viết thêm từ), INLINE_CHOICE (chọn từ trong câu chuyện).
 */
import clsx from 'clsx';
import { useMedia } from '@/platform/homework/components/mediaContext';
import OnScreenKeyboard from '@/platform/homework/components/OnScreenKeyboard';
import { ImageTile, LetterTile, WordChip, type TileState } from '@/platform/homework/components/tiles';
import { norm, type RendererProps } from '@/platform/homework/renderers/types';
import styles from '@/platform/homework/renderers/renderers.module.scss';

/** Màu thẻ khi xem lại: đáp án đúng xanh, chọn sai đỏ */
function choiceState(
  id: string,
  picked: string | null,
  keyId: string | null | undefined,
  review: boolean,
): TileState {
  if (!review || !keyId) return undefined;
  if (id === keyId) return 'ok';
  if (id === picked) return 'bad';
  return undefined;
}

export function MultipleChoiceRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'MULTIPLE_CHOICE'>) {
  const image = useMedia(config.imageMediaId);
  const review = mode === 'review';
  const picked = answer?.optionId ?? null;
  return (
    <div className={clsx(styles.col, styles.center)}>
      {image && <img className={styles.heroImage} src={image.url} alt="" />}
      {config.prompt && <p className={styles.learn}>{config.prompt}</p>}
      <div className={styles.row}>
        {config.options.map((option) => (
          <WordChip
            key={option.id}
            selected={picked === option.id}
            state={choiceState(option.id, picked, answerKey?.optionId, review)}
            disabled={review}
            onClick={() => onChange({ type: 'MULTIPLE_CHOICE', optionId: option.id })}
          >
            {option.text}
          </WordChip>
        ))}
      </div>
    </div>
  );
}

export function OddOneOutRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'ODD_ONE_OUT'>) {
  const review = mode === 'review';
  const picked = answer?.optionId ?? null;
  return (
    <div className={styles.row}>
      {config.options.map((option) => (
        <ImageTile
          key={option.id}
          mediaId={option.mediaId}
          label={option.label}
          crossed={picked === option.id}
          selected={picked === option.id}
          state={choiceState(option.id, picked, answerKey?.optionId, review)}
          disabled={review}
          onClick={review ? undefined : () => onChange({ type: 'ODD_ONE_OUT', optionId: option.id })}
        />
      ))}
    </div>
  );
}

export function PatternNextRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'PATTERN_NEXT'>) {
  const review = mode === 'review';
  const picked = answer?.optionId ?? null;
  const word = answer?.word ?? '';
  const set = (patch: Partial<{ optionId: string | null; word: string }>) =>
    onChange({
      type: 'PATTERN_NEXT',
      optionId: picked,
      word: config.requireWord ? word : undefined,
      ...patch,
    });
  const wordState: TileState =
    review && answerKey?.word ? (norm(answerKey.word) === norm(word) ? 'ok' : 'bad') : undefined;
  return (
    <div className={clsx(styles.col, styles.center)}>
      <div className={styles.row}>
        {config.sequence.map((mediaId, i) => (
          <ImageTile key={`${mediaId}-${i}`} mediaId={mediaId} size="sm" />
        ))}
        <span className={styles.learn}>?</span>
      </div>
      <div className={styles.row}>
        {config.options.map((option) => (
          <ImageTile
            key={option.id}
            mediaId={option.mediaId}
            label={option.word}
            selected={picked === option.id}
            state={choiceState(option.id, picked, answerKey?.optionId, review)}
            disabled={review}
            onClick={review ? undefined : () => set({ optionId: option.id })}
          />
        ))}
      </div>
      {config.requireWord && (
        <>
          <div className={clsx(styles.row, styles.wordBox)}>
            {word.split('').map((letter, i) => (
              <LetterTile key={i} letter={letter} state={wordState} />
            ))}
            {!review && <LetterTile letter="" active />}
          </div>
          {!review && (
            <OnScreenKeyboard
              className={styles.keyboard}
              onLetter={(letter) => word.length < 20 && set({ word: word + letter })}
              onBackspace={() => set({ word: word.slice(0, -1) })}
            />
          )}
        </>
      )}
    </div>
  );
}

const PLACEHOLDER = /\{\{([^}]+)\}\}/g;

export function InlineChoiceRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
}: RendererProps<'INLINE_CHOICE'>) {
  const review = mode === 'review';
  const picks = answer?.picks ?? [];
  const pickOf = (blankId: string) => picks.find((p) => p.blankId === blankId)?.option ?? null;
  const keyOf = (blankId: string) => answerKey?.picks.find((p) => p.blankId === blankId)?.option;
  const choose = (blankId: string, option: string) =>
    onChange({
      type: 'INLINE_CHOICE',
      picks: [...picks.filter((p) => p.blankId !== blankId), { blankId, option }],
    });
  // Tách đoạn văn thành chữ / chỗ trống theo thứ tự
  const parts: { text?: string; blankId?: string }[] = [];
  let last = 0;
  for (const match of config.text.matchAll(PLACEHOLDER)) {
    if (match.index > last) parts.push({ text: config.text.slice(last, match.index) });
    parts.push({ blankId: match[1].trim() });
    last = match.index + match[0].length;
  }
  if (last < config.text.length) parts.push({ text: config.text.slice(last) });
  return (
    <div className={styles.col}>
      {config.imageMediaIds.length > 0 && <Story ids={config.imageMediaIds} />}
      <p className={styles.sentence}>
        {parts.map((part, i) => {
          if (part.text !== undefined) return <span key={i}>{part.text}</span>;
          const blank = config.blanks.find((b) => b.id === part.blankId);
          if (!blank) return null;
          const picked = pickOf(blank.id);
          const key = keyOf(blank.id);
          return (
            <span key={i} className={styles.row} style={{ display: 'inline-flex' }}>
              {blank.options.map((option) => (
                <WordChip
                  key={option}
                  selected={picked === option}
                  state={
                    review && key
                      ? norm(option) === norm(key)
                        ? 'ok'
                        : picked === option
                          ? 'bad'
                          : undefined
                      : undefined
                  }
                  disabled={review}
                  onClick={() => choose(blank.id, option)}
                >
                  {option}
                </WordChip>
              ))}
            </span>
          );
        })}
      </p>
    </div>
  );
}

function Story({ ids }: { ids: readonly string[] }) {
  return (
    <div className={styles.story}>
      {ids.map((id, i) => (
        <StoryImage key={`${id}-${i}`} id={id} />
      ))}
    </div>
  );
}

function StoryImage({ id }: { id: string }) {
  const media = useMedia(id);
  return media ? <img src={media.url} alt="" /> : null;
}
