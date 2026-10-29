/**
 * Chọn nhân vật (spec §4, §9.2). Solo: chọn 1 trong 6. Team: sửa tên 2 đội, chạm khung đội rồi chạm nhân vật —
 * hai đội không được chọn trùng (nhân vật của đội kia hiện TAKEN). Mọi nhân vật như nhau, không có lợi thế điểm.
 */
import { useState } from 'react';
import clsx from 'clsx';
import { useHalloween } from '@/games/halloween-candy-quest/app/hooks';
import CharacterSprite from '@/games/halloween-candy-quest/app/components/CharacterSprite';
import { portraitUrl } from '@/games/halloween-candy-quest/app/assets';
import { TEAM_TONES } from '@/games/halloween-candy-quest/app/teamTone';
import { CHARACTERS } from '@/games/halloween-candy-quest/content/world';
import { MAX_TEAM_NAME } from '@/games/halloween-candy-quest/session/storage';
import { characterName, halloweenActions } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/games/halloween-candy-quest/app/screens/CharacterScreen.module.scss';

export default function CharacterScreen() {
  const mode = useHalloween((state) => state.settings.mode);
  const soloCharacter = useHalloween((state) => state.soloCharacter);
  const teams = useHalloween((state) => state.teams);
  const [active, setActive] = useState(0);
  const team = mode === 'team';

  const choose = (id: string) => {
    if (!team) {
      playSfx(SFX.UI_CLICK);
      halloweenActions.setSoloCharacter(id);
      return;
    }
    if (halloweenActions.setTeamCharacter(active, id)) {
      playSfx(SFX.TEAM_SELECTED);
      // Đội 1 chọn xong -> tự chuyển sang đội 2
      if (active === 0) setActive(1);
    } else playSfx(SFX.LOCKED);
  };

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title={team ? TEXT.teamSetup : TEXT.chooseCharacter}
        backLabel={TEXT.back}
        onBack={() => halloweenActions.openSetup()}
      />

      {team && (
        <div className={styles.teams}>
          {teams.map((setup, index) => (
            <div
              key={index}
              className={clsx(styles.team, styles[TEAM_TONES[index]], active === index && styles.activeTeam)}
            >
              <button
                type="button"
                className={styles.teamPick}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
              >
                <img src={portraitUrl(setup.characterId)} alt={characterName(setup.characterId)} />
              </button>
              <input
                className={styles.teamName}
                aria-label={`${TEXT.teamName} ${index + 1}`}
                value={setup.name}
                maxLength={MAX_TEAM_NAME}
                onFocus={() => setActive(index)}
                onChange={(event) => halloweenActions.setTeamName(index, event.target.value.toUpperCase())}
              />
            </div>
          ))}
        </div>
      )}
      {team && <p className={styles.hint}>{TEXT.pickFor(teams[active].name || `TEAM ${active + 1}`)}</p>}

      <ul className={styles.grid}>
        {CHARACTERS.map((character) => {
          const owner = team ? teams.findIndex((setup) => setup.characterId === character.id) : -1;
          const selected = team ? owner === active : soloCharacter === character.id;
          const taken = team && owner >= 0 && owner !== active;
          return (
            <li key={character.id}>
              <button
                type="button"
                className={clsx(
                  styles.character,
                  selected && styles.selected,
                  taken && styles.taken,
                  owner >= 0 && styles[TEAM_TONES[owner]],
                )}
                aria-pressed={selected}
                onClick={() => choose(character.id)}
              >
                <CharacterSprite id={character.id} pose={selected ? 'celebrate' : 'idle'} size={96} />
                <span className={styles.name}>{character.name}</span>
                {taken && <span className={styles.badge}>{TEXT.taken}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <Button
        color="orange"
        size="lg"
        className={styles.go}
        sfx={SFX.UI_START}
        onClick={() => halloweenActions.confirmCharacters()}
      >
        {TEXT.go} <Icon name="next" size={24} />
      </Button>
    </div>
  );
}
