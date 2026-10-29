/**
 * Chọn chế độ (spec §12 `mode_select`): SOLO ADVENTURE hoặc TEAM CANDY BATTLE (2 đội chơi lần lượt trên 1 màn).
 */
import CharacterSprite from '@/games/halloween-candy-quest/app/components/CharacterSprite';
import { halloweenActions } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import type { Mode } from '@/games/halloween-candy-quest/session/types';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/games/halloween-candy-quest/app/screens/ModeScreen.module.scss';

const MODES: { mode: Mode; title: string; sub: string; characters: string[] }[] = [
  { mode: 'solo', title: TEXT.solo, sub: TEXT.soloSub, characters: ['little_ghost'] },
  { mode: 'team', title: TEXT.team, sub: TEXT.teamSub, characters: ['pumpkin_kid', 'bat_explorer'] },
];

export default function ModeScreen() {
  return (
    <div className={styles.screen}>
      <ScreenHeader title={TEXT.chooseMode} backLabel={TEXT.back} onBack={() => halloweenActions.goHome()} />
      <div className={styles.modes}>
        {MODES.map(({ mode, title, sub, characters }) => (
          <button
            key={mode}
            type="button"
            className={styles.mode}
            data-mode={mode}
            onClick={() => {
              playSfx(SFX.UI_START);
              halloweenActions.chooseMode(mode);
            }}
          >
            <span className={styles.art}>
              {characters.map((id) => (
                <CharacterSprite key={id} id={id} pose="celebrate" size={96} />
              ))}
            </span>
            <span className={styles.title}>{title}</span>
            <span className={styles.sub}>{sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
