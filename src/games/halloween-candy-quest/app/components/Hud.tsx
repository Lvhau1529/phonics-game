/**
 * Thanh trên màn chơi (spec §13.1): giỏ kẹo + số kẹo (solo) hoặc 2 đội (đội đang chơi sáng lên; giáo viên có thể
 * ẩn điểm tới cuối trận), lượt x / n + tên khu vực, và cụm nút giáo viên (Pause, thay câu, Home) ở góc phải.
 */
import clsx from 'clsx';
import { basketUrl, portraitUrl } from '@/games/halloween-candy-quest/app/assets';
import { TEAM_TONES } from '@/games/halloween-candy-quest/app/teamTone';
import { ZONES } from '@/games/halloween-candy-quest/content/world';
import { basketLevel, CANDIES } from '@/games/halloween-candy-quest/session/rules';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import type { Game } from '@/games/halloween-candy-quest/session/types';
import styles from '@/games/halloween-candy-quest/app/components/Hud.module.scss';

interface HudProps {
  game: Game;
  onPause: () => void;
  onSkip: () => void;
  onHome: () => void;
  canSkip: boolean;
}

export default function Hud({ game, onPause, onSkip, onHome, canSkip }: HudProps) {
  const planned = game.plan[game.turn];
  const solo = game.settings.mode === 'solo';
  const turnsPerTeam = game.plan.length / game.teams.length;
  const showScore = solo || game.settings.showLiveScore;

  return (
    <header className={styles.hud}>
      <div className={styles.teams}>
        {game.teams.map((team, index) => (
          <div
            key={index}
            className={clsx(
              styles.team,
              !solo && styles[TEAM_TONES[index]],
              !solo && planned.team === index && styles.active,
            )}
          >
            <img className={styles.portrait} src={portraitUrl(team.characterId)} alt="" />
            {!solo && <span className={styles.name}>{team.name}</span>}
            <img
              className={styles.basket}
              src={basketUrl(basketLevel(team.score, turnsPerTeam * CANDIES.firstTry))}
              alt=""
            />
            <span key={team.score} className={styles.score} aria-label={`${team.score} candies`}>
              {showScore ? team.score : TEXT.hidden}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.progress}>
        <span className={styles.turn}>
          {TEXT.turn} {game.turn + 1}/{game.plan.length}
        </span>
        <span className={styles.zone}>{ZONES[planned.zone].title}</span>
      </div>

      <div className={styles.teacher} aria-label="Teacher controls">
        <button
          type="button"
          className={styles.control}
          aria-label={TEXT.pause}
          title={TEXT.pause}
          onClick={onPause}
        >
          ⏸
        </button>
        <button
          type="button"
          className={styles.control}
          aria-label={TEXT.skipQuestion}
          title={TEXT.skipQuestion}
          disabled={!canSkip}
          onClick={onSkip}
        >
          🔄
        </button>
        <button
          type="button"
          className={styles.control}
          aria-label={TEXT.home}
          title={TEXT.home}
          onClick={onHome}
        >
          🏠
        </button>
      </div>
    </header>
  );
}
