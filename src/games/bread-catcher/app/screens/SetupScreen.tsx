/**
 * Game Setup (plan §3–§5): chế độ, gói từ (có sẵn hoặc MY WORDS tự nhập), cấp độ, thời gian, tên đội.
 * Class Mode hiện 3 ô tên đội; Solo Mode chỉ 1 ô tên người chơi.
 * Lựa chọn được nhớ cho lần sau (session/storage.ts).
 */
import { mascotUrl } from '@/games/bread-catcher/app/assets';
import { LEVEL_TONE } from '@/games/bread-catcher/app/levelTone';
import Button from '@/ui/Button/Button';
import Field, { FieldHint } from '@/ui/Field/Field';
import NameInput from '@/ui/NameInput/NameInput';
import OptionGroup, { type Option } from '@/ui/OptionGroup/OptionGroup';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import CustomWordsInput from '@/games/bread-catcher/app/components/CustomWordsInput';
import TimeInput from '@/games/bread-catcher/app/components/TimeInput';
import { TeamTotalsCard } from '@/games/bread-catcher/app/components/Leaderboard';
import { useAppState, useTeamTotals } from '@/games/bread-catcher/app/hooks';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import {
  CUSTOM_PACK_LABEL,
  PACK_ORDER,
  PACKS,
  packPreview,
  parseCustomWords,
  wordLengthRange,
} from '@/games/bread-catcher/session/content';
import { sessionActions } from '@/games/bread-catcher/session/sessionStore';
import { LEVEL_ORDER, LEVELS, TIME_OPTIONS, timeLimitSeconds } from '@/games/bread-catcher/session/settings';
import {
  DEFAULT_PLAYER_NAME,
  DEFAULT_TEAM_NAMES,
  MAX_NAME_LENGTH,
  SOLO_MASCOT,
  TEAM_MASCOTS,
} from '@/games/bread-catcher/session/teams';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import type { GameMode, LevelId, PackId, SetupDraft, TimeOption } from '@/games/bread-catcher/session/types';
import { speech } from '@/core/utils/speech';
import styles from '@/games/bread-catcher/app/screens/SetupScreen.module.scss';

const MODE_OPTIONS: Option<GameMode>[] = [
  { value: 'class', label: UI_TEXT.classMode, sub: '3 teams' },
  { value: 'solo', label: UI_TEXT.soloMode, sub: '1 player' },
];

const PACK_OPTIONS: Option<PackId>[] = PACK_ORDER.map((id) => ({
  value: id,
  label: PACKS[id].label,
  sub: packPreview(PACKS[id].words, 3),
}));

const LEVEL_OPTIONS: Option<LevelId>[] = LEVEL_ORDER.map((id) => ({
  value: id,
  label: LEVELS[id].label,
  tone: LEVEL_TONE[id],
}));

export default function SetupScreen() {
  const draft = useAppState((state) => state.draft);
  const hasTotals = useTeamTotals().length > 0;
  const update = (patch: Partial<SetupDraft>) => sessionActions.updateDraft(patch);
  const level = LEVELS[draft.levelId];
  const custom = parseCustomWords(draft.customText);
  const canStart = draft.packId !== 'custom' || custom.words.length > 0;

  const packOptions: Option<PackId>[] = [
    ...PACK_OPTIONS,
    {
      value: 'custom',
      label: CUSTOM_PACK_LABEL,
      sub: custom.words.length > 0 ? packPreview(custom.words, 3) : UI_TEXT.typeYourOwn,
    },
  ];

  const timeOptions: Option<TimeOption>[] = TIME_OPTIONS.map((time) =>
    time === 'auto'
      ? { value: time, label: UI_TEXT.auto, sub: `${level.suggestedTime}s` }
      : { value: time, label: String(time), sub: 'sec' },
  );

  const setTeamName = (index: number, name: string) => {
    const teamNames = [...draft.teamNames] as SetupDraft['teamNames'];
    teamNames[index] = name;
    update({ teamNames });
  };

  const start = () => {
    speech.unlock(); // iOS: giọng đọc chỉ bật được trong thao tác chạm
    playSfx(SFX.UI_START);
    sessionActions.startSession();
  };

  return (
    <div className={styles.setup}>
      <ScreenHeader
        title={UI_TEXT.gameSetup}
        backLabel={UI_TEXT.back}
        onBack={() => sessionActions.goHome()}
      />

      <div className={styles.form}>
        <Field label={UI_TEXT.gameMode} guide="modes">
          <OptionGroup
            label={UI_TEXT.gameMode}
            options={MODE_OPTIONS}
            value={draft.mode}
            onChange={(mode) => update({ mode })}
          />
        </Field>

        <Field label={UI_TEXT.phonicsPack} guide="packs">
          <div className={styles.packs}>
            <OptionGroup
              label={UI_TEXT.phonicsPack}
              options={packOptions}
              value={draft.packId}
              onChange={(packId) => update({ packId })}
              columns={2}
            />
          </div>
          {draft.packId === 'custom' ? (
            <CustomWordsInput
              value={draft.customText}
              parsed={custom}
              summary={custom.words.length > 0 ? wordsSummary(custom.words) : ''}
              onChange={(customText) => update({ customText })}
            />
          ) : (
            <FieldHint>{wordsSummary(PACKS[draft.packId].words)}</FieldHint>
          )}
        </Field>

        <Field label={UI_TEXT.level} guide="levels">
          <OptionGroup
            label={UI_TEXT.level}
            options={LEVEL_OPTIONS}
            value={draft.levelId}
            onChange={(levelId) => update({ levelId })}
            columns={3}
          />
          <FieldHint hard={level.troll}>{level.hint}</FieldHint>
        </Field>

        <Field label={UI_TEXT.time} guide="time">
          <OptionGroup
            label={UI_TEXT.time}
            options={timeOptions}
            value={draft.time}
            onChange={(time) => update({ time })}
            columns={3}
          />
          <TimeInput
            value={draft.time}
            effectiveSeconds={timeLimitSeconds(draft)}
            onChange={(time) => update({ time })}
          />
        </Field>

        {draft.mode === 'class' ? (
          <Field label={UI_TEXT.teams}>
            <div className="flex flex-col gap-2">
              {TEAM_MASCOTS.map((mascot, index) => (
                <NameInput
                  key={mascot}
                  image={mascotUrl(mascot)}
                  maxLength={MAX_NAME_LENGTH}
                  label={[UI_TEXT.team1, UI_TEXT.team2, UI_TEXT.team3][index]}
                  placeholder={DEFAULT_TEAM_NAMES[index]}
                  value={draft.teamNames[index]}
                  onChange={(name) => setTeamName(index, name)}
                />
              ))}
            </div>
          </Field>
        ) : (
          <Field label={UI_TEXT.player}>
            <NameInput
              image={mascotUrl(SOLO_MASCOT)}
              maxLength={MAX_NAME_LENGTH}
              label={UI_TEXT.player}
              placeholder={DEFAULT_PLAYER_NAME}
              value={draft.playerName}
              onChange={(playerName) => update({ playerName })}
            />
          </Field>
        )}
      </div>

      {/* Tổng điểm các đội từ các buổi trước (có nút reset) */}
      {draft.mode === 'class' && hasTotals && <TeamTotalsCard />}

      <Button
        color="green"
        size="lg"
        sfx={null}
        className={styles.start}
        disabled={!canStart}
        onClick={start}
      >
        {UI_TEXT.start}
      </Button>
    </div>
  );
}

/** "45 words · 3–4 letters" */
function wordsSummary(words: readonly string[]): string {
  const { min, max } = wordLengthRange(words);
  return `${words.length} ${UI_TEXT.words.toLowerCase()} · ${min === max ? min : `${min}–${max}`} ${UI_TEXT.letters}`;
}
