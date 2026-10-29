/**
 * Vocabulary Manager (spec §10.2): bật / tắt 24 từ thư viện (chạm thẻ; 🔊 nghe thử), thêm từ riêng (chữ tiếng Anh +
 * nghĩa tuỳ chọn + ảnh upload), bật / tắt / xoá từ riêng. Lưu ngay trên máy. Âm thanh từ: giọng máy đọc chữ.
 */
import { useRef, useState } from 'react';
import clsx from 'clsx';
import { useHalloween } from '@/games/halloween-candy-quest/app/hooks';
import WordPicture from '@/games/halloween-candy-quest/app/components/WordPicture';
import { fileToWordImage } from '@/games/halloween-candy-quest/app/utils/image';
import { MAX_WORD_LENGTH } from '@/games/halloween-candy-quest/content/schema';
import {
  customWord,
  LIBRARY,
  libraryWord,
  type VocabWord,
} from '@/games/halloween-candy-quest/content/words';
import { halloweenActions, selectWords } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import { say } from '@/games/halloween-candy-quest/session/voice';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import Button from '@/ui/Button/Button';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import TextInput from '@/ui/TextInput/TextInput';
import styles from '@/games/halloween-candy-quest/app/screens/VocabScreen.module.scss';

const LIBRARY_WORDS = LIBRARY.map(libraryWord);

export default function VocabScreen() {
  const state = useHalloween((value) => value);
  const { vocabulary, settings } = state;
  const enabled = new Set(vocabulary.library);
  const total = selectWords(state).length;

  const hear = (word: VocabWord) =>
    say(word.text, settings.voiceMode === 'teacher' ? 'game' : settings.voiceMode);

  return (
    <div className={styles.vocab}>
      <ScreenHeader
        title={`${TEXT.vocab} · ${total}`}
        backLabel={TEXT.back}
        onBack={() => halloweenActions.openSetup()}
      />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>{TEXT.library}</h2>
          <div className={styles.row}>
            <Button
              color="green"
              onClick={() => halloweenActions.setAllLibrary(LIBRARY.map((word) => word.id))}
            >
              {TEXT.allOn}
            </Button>
            <Button color="cream" onClick={() => halloweenActions.setAllLibrary([])}>
              {TEXT.allOff}
            </Button>
          </div>
        </div>
        <ul className={styles.grid}>
          {LIBRARY_WORDS.map((word) => (
            <WordTile
              key={word.id}
              word={word}
              on={enabled.has(word.id)}
              onToggle={(on) => halloweenActions.setLibraryWord(word.id, on)}
              onHear={() => hear(word)}
            />
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>{TEXT.myWords}</h2>
        {vocabulary.custom.length === 0 ? (
          <p className={styles.empty}>{TEXT.noMyWords}</p>
        ) : (
          <ul className={styles.grid}>
            {vocabulary.custom.map((item) => (
              <WordTile
                key={item.id}
                word={customWord(item)}
                on={item.enabled}
                onToggle={(on) => halloweenActions.setCustomWord(item.id, on)}
                onHear={() => hear(customWord(item))}
                onRemove={() => halloweenActions.removeCustomWord(item.id)}
              />
            ))}
          </ul>
        )}
        <AddWordForm />
      </section>

      <Button color="orange" size="lg" className={styles.done} onClick={() => halloweenActions.openSetup()}>
        ✔ {TEXT.done}
      </Button>
    </div>
  );
}

function WordTile({
  word,
  on,
  onToggle,
  onHear,
  onRemove,
}: {
  word: VocabWord;
  on: boolean;
  onToggle: (on: boolean) => void;
  onHear: () => void;
  onRemove?: () => void;
}) {
  return (
    <li className={clsx(styles.tile, on && styles.on)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        className={styles.toggle}
        onClick={() => {
          playSfx(on ? SFX.UI_TOGGLE_OFF : SFX.UI_TOGGLE_ON);
          onToggle(!on);
        }}
      >
        <span className={styles.picture}>
          <WordPicture word={word} />
        </span>
        <span className={styles.text}>{word.text}</span>
        {word.meaning && <span className={styles.meaning}>{word.meaning}</span>}
        <span className={styles.mark} aria-hidden="true">
          {on ? '✔' : ''}
        </span>
      </button>
      <div className={styles.tileActions}>
        <button type="button" className={styles.small} aria-label={`Hear ${word.text}`} onClick={onHear}>
          🔊
        </button>
        {onRemove && (
          <button
            type="button"
            className={styles.small}
            aria-label={`${TEXT.remove} ${word.text}`}
            onClick={onRemove}
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  );
}

function AddWordForm() {
  const [text, setText] = useState('');
  const [meaning, setMeaning] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const problem = halloweenActions.addCustomWord(text, meaning, image);
    if (problem) {
      playSfx(SFX.WRONG_LETTER);
      setError(problem);
      return;
    }
    playSfx(SFX.CORRECT_LETTER);
    setText('');
    setMeaning('');
    setImage('');
    setError('');
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        add();
      }}
    >
      <h3>➕ {TEXT.addWord}</h3>
      <div className={styles.formRow}>
        <button type="button" className={styles.upload} onClick={() => fileRef.current?.click()}>
          {image ? <img src={image} alt="" /> : <span>🖼️ {TEXT.choosePicture}</span>}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            const result = await fileToWordImage(file);
            if (result) {
              setImage(result);
              setError('');
            } else setError(TEXT.badPicture);
          }}
        />
        <div className={styles.fields}>
          <TextInput
            label={TEXT.wordText}
            value={text}
            maxLength={MAX_WORD_LENGTH}
            placeholder={TEXT.wordPlaceholder}
            onChange={setText}
          />
          <TextInput
            label={TEXT.meaning}
            value={meaning}
            maxLength={60}
            placeholder={TEXT.meaningPlaceholder}
            onChange={setMeaning}
          />
        </div>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Button type="submit" color="green">
        {TEXT.add}
      </Button>
    </form>
  );
}
