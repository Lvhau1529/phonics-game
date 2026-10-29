/**
 * Teacher Setup (spec §10): chế độ, số lượt, độ khó, dạng thử thách, đồng hồ, ai đọc từ, hiện điểm (team),
 * bộ từ (sang màn WORDS) + READY CHECK (spec §10.5: lỗi chặn NEXT, cảnh báo vẫn cho chơi). Mọi lựa chọn lưu trên máy.
 */
import clsx from 'clsx';
import { useHalloween } from '@/games/halloween-candy-quest/app/hooks';
import { TURN_OPTIONS, TYPE_LABELS } from '@/games/halloween-candy-quest/session/rules';
import { halloweenActions, selectWords, setupCheck } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import {
  QUESTION_TYPES,
  type Difficulty,
  type Mode,
  type TimerSeconds,
  type VoiceMode,
} from '@/games/halloween-candy-quest/session/types';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import Button from '@/ui/Button/Button';
import Field from '@/ui/Field/Field';
import Icon from '@/ui/Icon/Icon';
import OptionGroup, { type Option } from '@/ui/OptionGroup/OptionGroup';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/games/halloween-candy-quest/app/screens/SetupScreen.module.scss';

const MODE_OPTIONS: Option<Mode>[] = [
  { value: 'solo', label: 'SOLO', sub: '1 player' },
  { value: 'team', label: 'TEAMS', sub: '2 teams' },
];
const DIFFICULTY_OPTIONS: Option<Difficulty>[] = [
  { value: 'easy', label: TEXT.easy, sub: TEXT.easySub, tone: 'green' },
  { value: 'normal', label: TEXT.normal, sub: TEXT.normalSub, tone: 'orange' },
  { value: 'mixed', label: TEXT.mixed, sub: TEXT.mixedSub, tone: 'purple' },
];
const TIMER_OPTIONS: Option<TimerSeconds>[] = [
  { value: 0, label: TEXT.off },
  { value: 30, label: TEXT.seconds(30) },
  { value: 45, label: TEXT.seconds(45) },
];
const VOICE_OPTIONS: Option<VoiceMode>[] = [
  { value: 'game', label: TEXT.voiceGame, sub: TEXT.voiceGameSub },
  { value: 'teacher', label: TEXT.voiceTeacher, sub: TEXT.voiceTeacherSub },
  { value: 'both', label: TEXT.voiceBoth, sub: TEXT.voiceBothSub },
];

export default function SetupScreen() {
  const state = useHalloween((value) => value);
  const { settings, vocabulary } = state;
  const wordCount = selectWords(state).length;
  const check = setupCheck(state);
  const team = settings.mode === 'team';
  const turns = team ? settings.teamTurns : settings.soloTurns;
  const turnOptions: Option<number>[] = (team ? TURN_OPTIONS.team : TURN_OPTIONS.solo).map((n) => ({
    value: n,
    label: String(n),
    sub: team ? `${n / 2} each` : undefined,
  }));

  const toggleType = (type: (typeof QUESTION_TYPES)[number]) => {
    const on = settings.questionTypes.includes(type);
    playSfx(on ? SFX.UI_TOGGLE_OFF : SFX.UI_TOGGLE_ON);
    halloweenActions.updateSettings({
      questionTypes: on
        ? settings.questionTypes.filter((value) => value !== type)
        : QUESTION_TYPES.filter((value) => value === type || settings.questionTypes.includes(value)),
    });
  };

  return (
    <div className={styles.setup}>
      <ScreenHeader title={TEXT.setup} backLabel={TEXT.back} onBack={() => halloweenActions.goHome()} />

      <div className={styles.form}>
        <Field label="MODE" guide="modes">
          <OptionGroup
            label="MODE"
            options={MODE_OPTIONS}
            value={settings.mode}
            onChange={(mode) => halloweenActions.updateSettings({ mode })}
          />
        </Field>
        <Field label={TEXT.turns} guide="zones">
          <OptionGroup
            label={TEXT.turns}
            options={turnOptions}
            value={turns}
            onChange={(value) =>
              halloweenActions.updateSettings(team ? { teamTurns: value } : { soloTurns: value })
            }
          />
        </Field>
        <Field label={TEXT.difficulty} guide="scoring">
          <OptionGroup
            label={TEXT.difficulty}
            options={DIFFICULTY_OPTIONS}
            value={settings.difficulty}
            onChange={(difficulty) => halloweenActions.updateSettings({ difficulty })}
          />
        </Field>
        <Field label={TEXT.challenges} guide="challenges">
          <div className={styles.chips} role="group" aria-label={TEXT.challenges}>
            {QUESTION_TYPES.map((type) => {
              const on = settings.questionTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  className={clsx(styles.chip, on && styles.chipOn)}
                  onClick={() => toggleType(type)}
                >
                  <span aria-hidden="true">{on ? '✔' : '＋'}</span> {TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label={TEXT.voice} guide="voice">
          <OptionGroup
            label={TEXT.voice}
            options={VOICE_OPTIONS}
            value={settings.voiceMode}
            onChange={(voiceMode) => halloweenActions.updateSettings({ voiceMode })}
          />
        </Field>
        <Field label={TEXT.timer}>
          <OptionGroup
            label={TEXT.timer}
            options={TIMER_OPTIONS}
            value={settings.timerSeconds}
            onChange={(timerSeconds) => halloweenActions.updateSettings({ timerSeconds })}
          />
        </Field>
        {team && (
          <Field label={TEXT.liveScore}>
            <OptionGroup
              label={TEXT.liveScore}
              options={[
                { value: 'on', label: TEXT.on },
                { value: 'off', label: TEXT.off, sub: 'Show at the end' },
              ]}
              value={settings.showLiveScore ? 'on' : 'off'}
              onChange={(value) => halloweenActions.updateSettings({ showLiveScore: value === 'on' })}
            />
          </Field>
        )}
        <Field label={TEXT.words} guide="words">
          <div className={styles.words}>
            <span className={styles.wordCount}>
              📚 {TEXT.wordsCount(wordCount)}
              {vocabulary.custom.length > 0 && <small> · {vocabulary.custom.length} MY WORDS</small>}
            </span>
            <Button color="blue" onClick={() => halloweenActions.openVocab()}>
              {TEXT.editWords}
            </Button>
          </div>
        </Field>
      </div>

      <section className={styles.check} aria-live="polite">
        <h2>{TEXT.checklist}</h2>
        <ul>
          {check.errors.map((message) => (
            <li key={message} className={styles.error}>
              ⛔ {message}
            </li>
          ))}
          {check.warnings.map((message) => (
            <li key={message} className={styles.warning}>
              ⚠️ {message}
            </li>
          ))}
          {check.errors.length === 0 && check.warnings.length === 0 && (
            <li className={styles.ok}>✅ {TEXT.allGood}</li>
          )}
        </ul>
      </section>

      <Button
        color="orange"
        size="lg"
        className={styles.next}
        sfx={SFX.UI_START}
        disabled={check.errors.length > 0}
        onClick={() => halloweenActions.openCharacters()}
      >
        {TEXT.next} <Icon name="next" size={24} />
      </Button>
    </div>
  );
}
