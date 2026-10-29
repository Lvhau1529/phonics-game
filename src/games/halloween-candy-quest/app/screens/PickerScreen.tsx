/**
 * Bí ngô quay chọn đội đi trước (spec §9.2 `team_picker`): ngẫu nhiên một lần trước trận, rồi START ADVENTURE.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { useHalloween } from '@/games/halloween-candy-quest/app/hooks';
import { GAME_SFX, playGameSfx } from '@/games/halloween-candy-quest/app/audio';
import { portraitUrl, propUrl } from '@/games/halloween-candy-quest/app/assets';
import { TEAM_TONES } from '@/games/halloween-candy-quest/app/teamTone';
import { halloweenActions } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import { SFX } from '@/core/audio/sfx';
import Button from '@/ui/Button/Button';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/games/halloween-candy-quest/app/screens/PickerScreen.module.scss';

const SPIN_MS = 2200;

export default function PickerScreen() {
  const teams = useHalloween((state) => state.teams);
  const [stage, setStage] = useState<'ready' | 'spinning' | 'done'>('ready');
  const [first, setFirst] = useState(0);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const spin = () => {
    if (stage !== 'ready') return;
    setFirst(halloweenActions.pickFirstTeam());
    setStage('spinning');
    playGameSfx(GAME_SFX.picker);
    timer.current = window.setTimeout(() => setStage('done'), SPIN_MS);
  };

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title={TEXT.whoStarts}
        backLabel={TEXT.back}
        onBack={() => halloweenActions.openCharacters()}
      />
      <div className={styles.arena}>
        {teams.map((team, index) => (
          <div
            key={index}
            className={clsx(
              styles.team,
              styles[TEAM_TONES[index]],
              stage === 'done' && (index === first ? styles.winner : styles.dim),
            )}
          >
            <img src={portraitUrl(team.characterId)} alt="" />
            <span>{team.name}</span>
          </div>
        ))}
        <div className={styles.pumpkinWrap}>
          <img
            src={propUrl(stage === 'done' ? 'pumpkin_open' : 'pumpkin_closed')}
            alt=""
            className={clsx(styles.spinner, stage === 'spinning' && styles.spinning)}
            style={{ '--turn': first === 0 ? '-0.25turn' : '0.25turn' } as CSSProperties}
          />
          {stage === 'done' && (
            <span className={clsx(styles.arrow, first === 0 ? styles.left : styles.right)}>➜</span>
          )}
        </div>
      </div>
      <p className={styles.result} aria-live="polite">
        {stage === 'done' ? TEXT.starts(teams[first].name) : ' '}
      </p>
      {stage === 'done' ? (
        <Button
          color="orange"
          size="lg"
          className={styles.action}
          sfx={SFX.UI_START}
          onClick={() => halloweenActions.startGame(first)}
        >
          🎃 {TEXT.startAdventure}
        </Button>
      ) : (
        <Button
          color="purple"
          size="lg"
          className={styles.action}
          disabled={stage === 'spinning'}
          onClick={spin}
        >
          {TEXT.spin}
        </Button>
      )}
    </div>
  );
}
