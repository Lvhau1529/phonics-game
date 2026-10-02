/**
 * Go Live Setup (plan §4.1): chế độ, gói từ, cấp độ, rồi
 *   Solo      — chọn nhân vật stream
 *   Classroom — tên 2 đội, số câu mỗi đội, STEAL, giới hạn giây trả lời (plan §5.2)
 * Lựa chọn được nhớ cho lần sau (session/storage.ts).
 */
import { useFoodStream, useProgress } from '@/games/food-stream/app/hooks';
import { imageUrl, streamerUrl } from '@/games/food-stream/app/assets';
import { levelsForPack } from '@/games/food-stream/content/levels';
import { getPack, packPreview, PACKS } from '@/games/food-stream/content/packs';
import {
  ANSWER_SECONDS_OPTIONS,
  foodStreamActions,
  QUESTIONS_PER_TEAM_OPTIONS,
} from '@/games/food-stream/session/store';
import { DEFAULT_TEAM_NAMES, MAX_NAME_LENGTH, TEAM_STREAMERS } from '@/games/food-stream/session/teams';
import type { GameMode, SetupDraft, StreamerId } from '@/games/food-stream/session/types';
import { TEXT } from '@/games/food-stream/session/text';
import { SFX } from '@/platform/audio/sfx';
import Button from '@/platform/ui/Button';
import Field, { FieldHint } from '@/platform/ui/Field';
import NameInput from '@/platform/ui/NameInput';
import OptionGroup, { type Option } from '@/platform/ui/OptionGroup';
import ScreenHeader from '@/platform/ui/ScreenHeader';
import { speech } from '@/shared/speech';
import styles from '@/games/food-stream/app/screens/SetupScreen.module.scss';

const MODE_OPTIONS: Option<GameMode>[] = [
  { value: 'solo', label: TEXT.solo, sub: TEXT.soloSub },
  { value: 'classroom', label: TEXT.classroom, sub: TEXT.classroomSub },
];

const STREAMER_OPTIONS: Option<StreamerId>[] = [
  { value: 'girl', label: 'PINK', icon: streamerUrl('girl') },
  { value: 'boy', label: 'BLUE', icon: streamerUrl('boy') },
];

const PACK_OPTIONS: Option<string>[] = PACKS.map((pack) => ({
  value: pack.id,
  label: pack.title,
  sub: packPreview(pack),
  icon: imageUrl(pack.icon),
}));

const QUESTION_OPTIONS: Option<number>[] = QUESTIONS_PER_TEAM_OPTIONS.map((count) => ({
  value: count,
  label: String(count),
}));

const STEAL_OPTIONS: Option<'on' | 'off'>[] = [
  { value: 'on', label: TEXT.stealOn, sub: TEXT.stealSub },
  { value: 'off', label: TEXT.stealOff },
];

const TIMER_OPTIONS: Option<number>[] = ANSWER_SECONDS_OPTIONS.map((seconds) =>
  seconds === 0
    ? { value: 0, label: TEXT.noTimer }
    : { value: seconds, label: String(seconds), sub: TEXT.seconds },
);

const starsLabel = (stars: number) => '★'.repeat(stars) + '☆'.repeat(3 - stars);

export default function SetupScreen() {
  const draft = useFoodStream((state) => state.draft);
  const progress = useProgress();
  const update = (patch: Partial<SetupDraft>) => foodStreamActions.updateDraft(patch);
  const solo = draft.mode === 'solo';
  const levels = levelsForPack(getPack(draft.packId));
  const level = levels.find((item) => item.id === draft.levelId) ?? levels[0];

  const levelOptions: Option<string>[] = levels.map((item) => ({
    value: item.id,
    label: `${item.number}. ${item.title}`,
    sub: solo ? starsLabel(progress[`${draft.packId}/${item.id}`]?.stars ?? 0) : undefined,
  }));

  const setTeamName = (index: number, name: string) => {
    const teamNames = [...draft.teamNames] as SetupDraft['teamNames'];
    teamNames[index] = name;
    update({ teamNames });
  };

  const start = () => {
    speech.unlock(); // iOS: giọng đọc chỉ bật được trong thao tác chạm
    foodStreamActions.startSession();
  };

  return (
    <div className={styles.setup}>
      <ScreenHeader title={TEXT.setup} backLabel={TEXT.back} onBack={() => foodStreamActions.goHome()} />

      <div className={styles.form}>
        <Field label={TEXT.mode} guide="modes">
          <OptionGroup
            label={TEXT.mode}
            options={MODE_OPTIONS}
            value={draft.mode}
            onChange={(mode) => update({ mode })}
          />
        </Field>

        <Field label={TEXT.wordPack} guide="packs">
          <OptionGroup
            label={TEXT.wordPack}
            options={PACK_OPTIONS}
            value={draft.packId}
            onChange={(packId) => update({ packId })}
            columns={2}
          />
        </Field>

        <Field label={TEXT.level} guide="levels">
          <OptionGroup
            label={TEXT.level}
            options={levelOptions}
            value={level.id}
            onChange={(levelId) => update({ levelId })}
            columns={2}
          />
          <FieldHint>
            {level.hint}
            {level.timeLimitSec ? ` (${level.timeLimitSec} ${TEXT.seconds})` : ''}
          </FieldHint>
        </Field>

        {solo ? (
          <Field label={TEXT.streamer}>
            <OptionGroup
              label={TEXT.streamer}
              options={STREAMER_OPTIONS}
              value={draft.streamer}
              onChange={(streamer) => update({ streamer })}
            />
          </Field>
        ) : (
          <>
            <Field label={TEXT.teams} guide="modes">
              <div className="flex flex-col gap-2">
                {TEAM_STREAMERS.map((streamer, index) => (
                  <NameInput
                    key={streamer}
                    image={streamerUrl(streamer)}
                    label={DEFAULT_TEAM_NAMES[index]}
                    placeholder={DEFAULT_TEAM_NAMES[index]}
                    value={draft.teamNames[index]}
                    maxLength={MAX_NAME_LENGTH}
                    onChange={(name) => setTeamName(index, name)}
                  />
                ))}
              </div>
            </Field>
            <Field label={TEXT.questionsPerTeam}>
              <OptionGroup
                label={TEXT.questionsPerTeam}
                options={QUESTION_OPTIONS}
                value={draft.questionsPerTeam}
                onChange={(questionsPerTeam) => update({ questionsPerTeam })}
              />
            </Field>
            <Field label={TEXT.steal} guide="teacher">
              <OptionGroup
                label={TEXT.steal}
                options={STEAL_OPTIONS}
                value={draft.steal ? 'on' : 'off'}
                onChange={(value) => update({ steal: value === 'on' })}
              />
            </Field>
            <Field label={TEXT.answerTimer} guide="teacher">
              <OptionGroup
                label={TEXT.answerTimer}
                options={TIMER_OPTIONS}
                value={draft.answerSeconds}
                onChange={(answerSeconds) => update({ answerSeconds })}
              />
            </Field>
          </>
        )}
      </div>

      <Button color="pink" size="lg" sfx={SFX.UI_START} className={styles.start} onClick={start}>
        {TEXT.goLive}
      </Button>
    </div>
  );
}
