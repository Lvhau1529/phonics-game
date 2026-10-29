/**
 * Kết quả (spec §8.3, §9.5) ở lễ hội: Solo — nhân vật ăn mừng, giỏ kẹo, tổng kẹo, "Happy Halloween!". Team — hai giỏ
 * hai bên, đội nhiều kẹo hơn được công bố, hoà thì "It's a tie!" — cả hai đội đều ăn mừng. Danh sách từ đã chơi
 * (chạm để nghe lại), không nêu điểm yếu của bé. Nút: PLAY AGAIN, NEW WORD SET, HOME.
 */
import { useEffect } from 'react';
import clsx from 'clsx';
import { useHalloween } from '@/games/halloween-candy-quest/app/hooks';
import CharacterSprite from '@/games/halloween-candy-quest/app/components/CharacterSprite';
import WordPicture from '@/games/halloween-candy-quest/app/components/WordPicture';
import { GAME_SFX, playGameSfx } from '@/games/halloween-candy-quest/app/audio';
import { basketUrl, fxUrl } from '@/games/halloween-candy-quest/app/assets';
import { TEAM_TONES } from '@/games/halloween-candy-quest/app/teamTone';
import { basketLevel, CANDIES, leader } from '@/games/halloween-candy-quest/session/rules';
import { halloweenActions } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import type { Game } from '@/games/halloween-candy-quest/session/types';
import { say } from '@/games/halloween-candy-quest/session/voice';
import { GemReward } from '@/modules/gems';
import { PointsSynced } from '@/modules/results';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import styles from '@/games/halloween-candy-quest/app/screens/ResultsScreen.module.scss';

export default function ResultsScreen() {
  const game = useHalloween((state) => state.game);
  const outcome = useHalloween((state) => state.outcome);

  useEffect(() => {
    playGameSfx(GAME_SFX.celebration);
  }, []);

  if (!game || !outcome) return null;
  const solo = game.settings.mode === 'solo';
  const maxPerTeam = (game.plan.length / game.teams.length) * CANDIES.firstTry;
  const winner = leader(game.teams);

  return (
    <div className={styles.results}>
      <img className={styles.confetti} src={fxUrl('confetti')} alt="" aria-hidden="true" />
      <h1 className={styles.title}>🎃 {TEXT.happyHalloween}</h1>

      {solo ? (
        <div className={styles.solo}>
          <CharacterSprite id={game.teams[0].characterId} pose="celebrate" size={128} />
          <img
            className={styles.basket}
            src={basketUrl(basketLevel(game.teams[0].score, maxPerTeam))}
            alt=""
          />
          <p className={styles.total}>
            {TEXT.youCollected}
            <b>
              🍬 {game.teams[0].score} {TEXT.candiesWord}
            </b>
          </p>
        </div>
      ) : (
        <>
          <div className={styles.teams}>
            {game.teams.map((team, index) => (
              <div
                key={index}
                className={clsx(styles.team, styles[TEAM_TONES[index]], winner === index && styles.winner)}
              >
                {winner === index && <span className={styles.crown}>👑</span>}
                <CharacterSprite id={team.characterId} pose="celebrate" size={96} />
                <span className={styles.teamName}>{team.name}</span>
                <img className={styles.basket} src={basketUrl(basketLevel(team.score, maxPerTeam))} alt="" />
                <span className={styles.score}>🍬 {team.score}</span>
              </div>
            ))}
          </div>
          <p className={styles.verdict}>
            {winner === null ? (
              <>
                <b>{TEXT.tie}</b> {TEXT.tieSub}
              </>
            ) : (
              TEXT.teamWins(game.teams[winner].name)
            )}
          </p>
        </>
      )}

      <WordsPlayed game={game} />
      <GemReward amount={outcome.gemsEarned} />
      <PointsSynced sessionId={outcome.syncId} />

      <div className={styles.actions}>
        <Button color="orange" size="lg" onClick={() => halloweenActions.playAgain()}>
          <Icon name="play" size={24} /> {TEXT.playAgain}
        </Button>
        <div className={styles.row}>
          <Button color="purple" onClick={() => halloweenActions.newWordSet()}>
            {TEXT.newWords}
          </Button>
          <Button color="blue" onClick={() => halloweenActions.goHome()}>
            {TEXT.home}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Các từ đã gặp trong ván (mỗi từ một lần) — chạm để nghe lại */
function WordsPlayed({ game }: { game: Game }) {
  const seen = [...new Set(game.records.map((record) => record.targetId))];
  const words = seen
    .map((id) => game.words.find((word) => word.id === id))
    .filter((word) => word !== undefined);
  return (
    <section className={styles.words}>
      <h2>{TEXT.wordsWePlayed}</h2>
      <ul>
        {words.map((word) => (
          <li key={word.id}>
            <button
              type="button"
              onClick={() =>
                say(word.text, game.settings.voiceMode === 'teacher' ? 'game' : game.settings.voiceMode)
              }
            >
              <span className={styles.thumb}>
                <WordPicture word={word} />
              </span>
              <span>{word.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
