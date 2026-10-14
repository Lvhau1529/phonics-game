/**
 * Ô MY WORDS ở màn Setup: giáo viên gõ / dán bộ từ riêng cho buổi chơi.
 * Tách từ ngay khi gõ, hiện các từ sẽ rơi trong game (bấm để nghe đọc) và phần bị bỏ qua.
 * Nội dung ô được lưu cùng form Setup nên lần sau mở lại vẫn còn.
 */
import clsx from 'clsx';
import { CUSTOM_WORD_LETTERS, type ParsedWords } from '@/games/bread-catcher/session/content';
import { RULES } from '@/games/bread-catcher/session/settings';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { useStore } from '@/core/store/useStore';
import { prefsStore } from '@/core/audio/prefs';
import { FieldHint } from '@/ui/Field/Field';
import { speech } from '@/core/utils/speech';
import styles from '@/games/bread-catcher/app/components/CustomWordsInput.module.scss';

const MAX_TEXT_LENGTH = 2000;

interface CustomWordsInputProps {
  value: string;
  parsed: ParsedWords;
  /** "8 words · 3–5 letters" */
  summary: string;
  onChange: (text: string) => void;
}

export default function CustomWordsInput({ value, parsed, summary, onChange }: CustomWordsInputProps) {
  const canHear = useStore(prefsStore, (prefs) => prefs.voice) && speech.supported;
  const { words, skipped } = parsed;

  return (
    <div className={clsx(styles.customWords, words.length === 0 && styles.empty)}>
      <div className={styles.box}>
        <textarea
          value={value}
          rows={3}
          maxLength={MAX_TEXT_LENGTH}
          placeholder={UI_TEXT.myWordsPlaceholder}
          aria-label={UI_TEXT.myWords}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
        {value && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              playSfx(SFX.UI_CLICK);
              onChange('');
            }}
          >
            {UI_TEXT.clear}
          </button>
        )}
      </div>

      {words.length > 0 ? (
        <ul className={styles.chips} aria-label={UI_TEXT.words}>
          {words.map((word) => (
            <li key={word}>
              <button
                type="button"
                className={styles.chip}
                disabled={!canHear}
                aria-label={canHear ? `${word.toLowerCase()} 🔊` : undefined}
                onClick={() => speech.say(word)}
              >
                {word}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <FieldHint hard>{UI_TEXT.noWordsYet}</FieldHint>
      )}

      {skipped.length > 0 && (
        <FieldHint hard>
          {UI_TEXT.skipped} ({UI_TEXT.skippedRule}, {CUSTOM_WORD_LETTERS.min}–{CUSTOM_WORD_LETTERS.max}{' '}
          {UI_TEXT.letters}): <span className={styles.skipped}>{skipped.join(', ')}</span>
        </FieldHint>
      )}
      {words.length > 0 && (
        <FieldHint>
          {[
            `${summary}.`,
            canHear && UI_TEXT.tapToHear,
            words.length < RULES.wordsPerTurn && UI_TEXT.fewWordsTip,
          ]
            .filter(Boolean)
            .join(' ')}
        </FieldHint>
      )}
    </div>
  );
}
