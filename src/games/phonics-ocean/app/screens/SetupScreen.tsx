/**
 * Dive Setup: chọn cấp (8 cấp theo trình tự phonics, hiện số sao đã đạt) và bật / tắt cá săn mồi
 * (OFF = chế độ luyện tập không mất tim). Lựa chọn được nhớ cho lần sau (session/storage.ts).
 */
import { imageUrl, playerUrl } from '@/games/phonics-ocean/app/assets';
import { usePhonicsOcean, useProgress } from '@/games/phonics-ocean/app/hooks';
import { getLevel, LEVELS } from '@/games/phonics-ocean/content/levels';
import { phonicsOceanActions } from '@/games/phonics-ocean/session/store';
import { TEXT } from '@/games/phonics-ocean/session/text';
import { SFX } from '@/platform/audio/sfx';
import Button from '@/platform/ui/Button';
import Field, { FieldHint } from '@/platform/ui/Field';
import OptionGroup, { type Option } from '@/platform/ui/OptionGroup';
import ScreenHeader from '@/platform/ui/ScreenHeader';
import { speech } from '@/shared/speech';
import styles from '@/games/phonics-ocean/app/screens/SetupScreen.module.scss';

const PREDATOR_OPTIONS: Option<'on' | 'off'>[] = [
  { value: 'on', label: TEXT.predatorsOn, sub: TEXT.predatorsOnSub, icon: imageUrl('predator.shark.0') },
  { value: 'off', label: TEXT.predatorsOff, sub: TEXT.predatorsOffSub, icon: playerUrl(1) },
];

const starsLabel = (stars: number) => '★'.repeat(stars) + '☆'.repeat(3 - stars);

export default function SetupScreen() {
  const draft = usePhonicsOcean((state) => state.draft);
  const progress = useProgress();
  const level = getLevel(draft.levelId);

  const levelOptions: Option<string>[] = LEVELS.map((item) => ({
    value: item.id,
    label: `${item.number}. ${item.title}`,
    sub: starsLabel(progress[item.id]?.stars ?? 0),
  }));

  const start = () => {
    speech.unlock(); // iOS: giọng đọc chỉ bật được trong thao tác chạm
    phonicsOceanActions.startSession();
  };

  return (
    <div className={styles.setup}>
      <ScreenHeader title={TEXT.setup} backLabel={TEXT.back} onBack={() => phonicsOceanActions.goHome()} />

      <div className={styles.form}>
        <Field label={TEXT.level} guide="levels">
          <OptionGroup
            label={TEXT.level}
            options={levelOptions}
            value={level.id}
            onChange={(levelId) => phonicsOceanActions.updateDraft({ levelId })}
            columns={2}
          />
          <FieldHint>
            {level.focus} · {level.correctToClear} {TEXT.toClear} · {level.roundSeconds} {TEXT.seconds}
          </FieldHint>
        </Field>

        <Field label={TEXT.predators} guide="howto">
          <OptionGroup
            label={TEXT.predators}
            options={PREDATOR_OPTIONS}
            value={draft.predators ? 'on' : 'off'}
            onChange={(value) => phonicsOceanActions.updateDraft({ predators: value === 'on' })}
          />
          <FieldHint>{TEXT.tryHint}</FieldHint>
        </Field>
      </div>

      <Button color="green" size="lg" sfx={SFX.UI_START} className={styles.start} onClick={start}>
        {TEXT.start}
      </Button>
    </div>
  );
}
