/**
 * Chọn thế giới: tên bé (tuỳ chọn), 3 thẻ thế giới (tranh, mẫu câu, sao đã đạt) + ALL WORLDS, bật / tắt bước nói.
 * Chạm thẻ thế giới là vào chơi luôn (như bản gốc); thẻ đang chọn được nhớ cho lần sau.
 *
 * Bản gốc: cả thẻ là role="button" mà bên trong lại có <button> -> Enter trên nút gọi load() hai lần.
 */
import clsx from 'clsx';
import { useExplorers, useProgress } from '@/games/english-explorers/app/hooks';
import Picture from '@/games/english-explorers/app/components/Picture';
import { ALL_WORLDS, ALL_WORLDS_COUNT, WORLDS } from '@/games/english-explorers/content/worlds';
import { englishExplorersActions, MAX_NAME_LENGTH } from '@/games/english-explorers/session/store';
import { TEXT } from '@/games/english-explorers/session/text';
import { pictureUrl } from '@/games/english-explorers/app/assets';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { speech } from '@/core/utils/speech';
import Field from '@/ui/Field/Field';
import NameInput from '@/ui/NameInput/NameInput';
import OptionGroup, { type Option } from '@/ui/OptionGroup/OptionGroup';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/games/english-explorers/app/screens/SetupScreen.module.scss';

const SPEAKING_OPTIONS: Option<'on' | 'off'>[] = [
  { value: 'on', label: TEXT.on, sub: TEXT.speakingOnSub },
  { value: 'off', label: TEXT.off, sub: TEXT.speakingOffSub },
];

const stars = (count: number) => '★'.repeat(count) + '☆'.repeat(3 - count);

export default function SetupScreen() {
  const draft = useExplorers((state) => state.draft);
  const progress = useProgress();

  const start = (world: string) => {
    speech.unlock(); // iOS: giọng đọc chỉ bật được trong thao tác chạm
    playSfx(SFX.UI_START);
    englishExplorersActions.startRound(world);
  };

  return (
    <div className={styles.setup}>
      <ScreenHeader
        title={TEXT.setup}
        backLabel={TEXT.back}
        onBack={() => englishExplorersActions.goHome()}
      />

      <div className={styles.form}>
        <Field label={TEXT.name}>
          <NameInput
            image={pictureUrl('lion')}
            label={TEXT.name}
            placeholder={TEXT.namePlaceholder}
            value={draft.name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(name) => englishExplorersActions.updateDraft({ name })}
          />
        </Field>
        <Field label={TEXT.speakingStep} guide="speaking">
          <OptionGroup
            label={TEXT.speakingStep}
            options={SPEAKING_OPTIONS}
            value={draft.speaking ? 'on' : 'off'}
            onChange={(value) => englishExplorersActions.updateDraft({ speaking: value === 'on' })}
          />
        </Field>
      </div>

      <div className={styles.worlds}>
        {WORLDS.map((world, index) => (
          <button
            key={world.id}
            type="button"
            className={clsx(
              styles.world,
              styles[`world${index + 1}`],
              draft.world === world.id && styles.last,
            )}
            onClick={() => start(world.id)}
          >
            <Picture image={world.cover} className={styles.worldImage} />
            <span className={styles.ribbon}>{TEXT.worldLabel(index + 1)}</span>
            <span className={styles.worldTitle}>
              {world.emoji} {world.title}
            </span>
            <span className={styles.grammar}>{world.grammar}</span>
            <span className={styles.stars} aria-label={`${progress[world.id]?.stars ?? 0} / 3`}>
              {stars(progress[world.id]?.stars ?? 0)}
            </span>
          </button>
        ))}
        <button
          type="button"
          className={clsx(styles.world, styles.allWorlds, draft.world === ALL_WORLDS && styles.last)}
          onClick={() => start(ALL_WORLDS)}
        >
          <span className={styles.allEmoji} aria-hidden="true">
            🌍
          </span>
          <span className={styles.worldTitle}>{TEXT.allWorlds}</span>
          <span className={styles.grammar}>
            {TEXT.allWorldsSub} · {ALL_WORLDS_COUNT} {TEXT.questions}
          </span>
          <span className={styles.stars} aria-label={`${progress[ALL_WORLDS]?.stars ?? 0} / 3`}>
            {stars(progress[ALL_WORLDS]?.stars ?? 0)}
          </span>
        </button>
      </div>
    </div>
  );
}
