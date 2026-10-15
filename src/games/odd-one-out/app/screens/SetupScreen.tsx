/**
 * Setup: tên bé (cho bảng xếp hạng), chủ đề (15 + MIXED), cấp, số câu (chỉ MIXED), bật / tắt bước nói.
 *
 * Bản gốc có thêm "Level" trong Teacher zone, lọc chồng lên lựa chọn cấp của bé -> chọn EASY ở Teacher zone
 * rồi bé bấm CHALLENGE là "No questions match". Ở đây chỉ còn một chỗ chọn cấp.
 */
import { useRef, useState } from 'react';
import clsx from 'clsx';
import { ART } from '@/games/odd-one-out/app/assets';
import { useOddOneOut } from '@/games/odd-one-out/app/hooks';
import { MIXED, TOPICS, type Topic } from '@/games/odd-one-out/content/puzzles';
import { MIXED_COUNTS, roundLength } from '@/games/odd-one-out/session/rules';
import { cleanName, MAX_NAME_LENGTH, oddOneOutActions } from '@/games/odd-one-out/session/store';
import { TEXT } from '@/games/odd-one-out/session/text';
import type { LevelChoice, SetupDraft } from '@/games/odd-one-out/session/types';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { speech } from '@/core/utils/speech';
import Button from '@/ui/Button/Button';
import Field, { FieldHint } from '@/ui/Field/Field';
import NameInput from '@/ui/NameInput/NameInput';
import OptionGroup, { type Option } from '@/ui/OptionGroup/OptionGroup';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/games/odd-one-out/app/screens/SetupScreen.module.scss';

const LEVEL_OPTIONS: Option<LevelChoice>[] = [
  { value: 'easy', label: TEXT.easy, sub: TEXT.easySub, tone: 'green' },
  { value: 'challenge', label: TEXT.challenge, sub: TEXT.challengeSub, tone: 'orange' },
  { value: 'mix', label: TEXT.mix, sub: TEXT.mixSub, tone: 'purple' },
];

const COUNT_OPTIONS: Option<number>[] = MIXED_COUNTS.map((count) => ({ value: count, label: String(count) }));

const SPEAKING_OPTIONS: Option<'on' | 'off'>[] = [
  { value: 'on', label: TEXT.on, sub: TEXT.speakingOnSub },
  { value: 'off', label: TEXT.off, sub: TEXT.speakingOffSub },
];

export default function SetupScreen() {
  const draft = useOddOneOut((state) => state.draft);
  const [nameMissing, setNameMissing] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const update = (patch: Partial<SetupDraft>) => oddOneOutActions.updateDraft(patch);
  const length = roundLength(draft);

  const start = () => {
    speech.unlock(); // iOS: giọng đọc chỉ bật được trong thao tác chạm
    if (oddOneOutActions.startRound()) return;
    // Chưa có tên: ô tên ở đầu form (nút START dính đáy màn) -> cuộn lên và đặt con trỏ vào ô
    setNameMissing(true);
    nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nameRef.current?.querySelector('input')?.focus({ preventScroll: true });
  };

  return (
    <div className={styles.setup}>
      <ScreenHeader title={TEXT.setup} backLabel={TEXT.back} onBack={() => oddOneOutActions.goHome()} />

      <div className={styles.form}>
        <Field label={TEXT.name} guide="leaderboard">
          <div ref={nameRef}>
            <NameInput
              image={ART.boyDog}
              label={TEXT.name}
              placeholder={TEXT.namePlaceholder}
              value={draft.name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(name) => {
                setNameMissing(false);
                update({ name });
              }}
            />
          </div>
          {nameMissing && !cleanName(draft.name) && <FieldHint hard>{TEXT.nameNeeded}</FieldHint>}
        </Field>

        <Field label={TEXT.topic} guide="topics">
          <div className={styles.topics} role="radiogroup" aria-label={TEXT.topic}>
            {[...TOPICS, MIXED].map((topic) => (
              <TopicButton
                key={topic.id}
                topic={topic}
                selected={draft.topic === topic.id}
                onSelect={() => update({ topic: topic.id })}
              />
            ))}
          </div>
        </Field>

        <Field label={TEXT.level} guide="levels">
          <OptionGroup
            label={TEXT.level}
            options={LEVEL_OPTIONS}
            value={draft.level}
            onChange={(level) => update({ level })}
          />
        </Field>

        {draft.topic === MIXED.id && (
          <Field label={TEXT.puzzles}>
            <OptionGroup
              label={TEXT.puzzles}
              options={COUNT_OPTIONS}
              value={draft.count}
              onChange={(count) => update({ count })}
            />
          </Field>
        )}

        <Field label={TEXT.speakingStep} guide="speaking">
          <OptionGroup
            label={TEXT.speakingStep}
            options={SPEAKING_OPTIONS}
            value={draft.speaking ? 'on' : 'off'}
            onChange={(value) => update({ speaking: value === 'on' })}
          />
        </Field>
        <FieldHint>{TEXT.puzzlesInRound(length)}</FieldHint>
      </div>

      <Button color="pink" size="lg" sfx={SFX.UI_START} className={styles.start} onClick={start}>
        {TEXT.start}
      </Button>
    </div>
  );
}

function TopicButton({
  topic,
  selected,
  onSelect,
}: {
  topic: Topic;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={clsx(styles.topic, selected && styles.topicSelected, topic.id === MIXED.id && styles.mixed)}
      onClick={() => {
        if (selected) return;
        playSfx(SFX.UI_CLICK);
        onSelect();
      }}
    >
      <span className={styles.topicEmoji} aria-hidden="true">
        {topic.emoji}
      </span>
      <span className={styles.topicName}>{topic.title}</span>
    </button>
  );
}
