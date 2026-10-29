/**
 * Màn chơi (spec §5, §12 `adventure`): HUD + sân khấu + các lớp phủ theo pha của lượt.
 *   zone      — tên khu vực (tự qua sau ~2.6s, SKIP được)
 *   walk      — nhân vật tự đi tới nhà (Stage)
 *   knock     — "Tap the door!", cửa sáng; knocking — gõ cửa (~0.9s)
 *   greeting  — chủ nhà: "Trick or treat!" (~1.5s, chạm để qua)
 *   question / feedback — QuestionPanel; reward — kẹo bay vào giỏ (~1.9s)
 *   turn_end  — (team) chờ giáo viên bấm NEXT TURN
 * Hẹn giờ của từng pha dừng khi Pause; action nào cũng kèm turnId nên hẹn giờ cũ không làm hỏng lượt mới.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { useHalloween } from '@/games/halloween-candy-quest/app/hooks';
import Hud from '@/games/halloween-candy-quest/app/components/Hud';
import QuestionPanel from '@/games/halloween-candy-quest/app/components/QuestionPanel';
import Stage from '@/games/halloween-candy-quest/app/components/Stage';
import { GAME_SFX, playGameSfx } from '@/games/halloween-candy-quest/app/audio';
import { CANDIES, candyUrl, npcUrl, portraitUrl } from '@/games/halloween-candy-quest/app/assets';
import { walkMs, walkPath } from '@/games/halloween-candy-quest/app/stageLayout';
import { TEAM_TONES } from '@/games/halloween-candy-quest/app/teamTone';
import { ZONES } from '@/games/halloween-candy-quest/content/world';
import { halloweenActions } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import type { Game } from '@/games/halloween-candy-quest/session/types';
import { say } from '@/games/halloween-candy-quest/session/voice';
import { speech } from '@/core/utils/speech';
import AudioToggles from '@/ui/AudioToggles/AudioToggles';
import Button from '@/ui/Button/Button';
import Dialog from '@/ui/Dialog/Dialog';
import Icon from '@/ui/Icon/Icon';
import { MASCOT } from '@/ui/icons';
import styles from '@/games/halloween-candy-quest/app/screens/PlayScreen.module.scss';

const ZONE_MS = 2600;
const KNOCK_MS = 900;
const GREETING_MS = 1500;
const FEEDBACK_MS = { correct: 1400, wrong: 1300, reveal: 2600 } as const;
const REWARD_MS = 1900;

/** Hẹn giờ cho pha hiện tại; không chạy khi Pause (bỏ Pause thì đếm lại từ đầu pha) */
function usePhaseTimer(game: Game, phase: Game['phase'], ms: number, action: (turnId: string) => void) {
  const turnId = game.plan[game.turn].turnId;
  const active = game.phase === phase && !game.paused;
  const latest = useRef(action);
  useEffect(() => {
    latest.current = action;
  });
  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setTimeout(() => latest.current(turnId), ms);
    return () => window.clearTimeout(timer);
  }, [active, turnId, ms]);
}

export default function PlayScreen() {
  const game = useHalloween((state) => state.game);
  useEffect(() => () => speech.cancel(), []);
  return game ? <PlayView game={game} /> : null;
}

function PlayView({ game }: { game: Game }) {
  const [quitOpen, setQuitOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const planned = game.plan[game.turn];
  const { from, to } = walkPath(game);

  usePhaseTimer(game, 'zone', ZONE_MS, halloweenActions.zoneShown);
  usePhaseTimer(game, 'walk', walkMs(from, to), halloweenActions.arrived);
  usePhaseTimer(game, 'knocking', KNOCK_MS, halloweenActions.doorOpened);
  usePhaseTimer(game, 'greeting', GREETING_MS, halloweenActions.greeted);
  usePhaseTimer(game, 'feedback', FEEDBACK_MS[game.feedback ?? 'correct'], halloweenActions.feedbackDone);
  usePhaseTimer(game, 'reward', REWARD_MS, halloweenActions.rewardDone);

  // Âm thanh theo pha
  const phaseKey = `${planned.turnId}:${game.phase}:${game.feedback ?? ''}`;
  useEffect(() => {
    if (game.paused) return;
    if (game.phase === 'zone') playGameSfx(GAME_SFX.zone);
    if (game.phase === 'greeting') playGameSfx(GAME_SFX.doorOpen);
    if (game.phase === 'knock') say(TEXT.knockHint, game.settings.voiceMode);
    if (game.feedback === 'correct' && game.phase === 'feedback') playGameSfx(GAME_SFX.correct);
    if (game.feedback === 'wrong') playGameSfx(GAME_SFX.tryAgain);
    if (game.feedback === 'reveal') playGameSfx(GAME_SFX.hint);
    if (game.phase === 'reward' && game.lastCandies > 0) playGameSfx(GAME_SFX.candy);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- phát một lần mỗi khi đổi pha
  }, [phaseKey]);

  // Thông báo nhỏ (không thay được câu) tự tắt
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const canSkip =
    !game.paused &&
    (['knock', 'knocking', 'greeting', 'question'].includes(game.phase) ||
      (game.phase === 'feedback' && game.feedback === 'wrong'));
  const inQuestion = game.phase === 'question' || game.phase === 'feedback';

  return (
    <div className={styles.play}>
      <Hud
        game={game}
        canSkip={canSkip}
        onPause={() => halloweenActions.setPaused(true)}
        onSkip={() => {
          if (!halloweenActions.skipQuestion()) setNotice(TEXT.noReplacement);
        }}
        onHome={() => {
          halloweenActions.setPaused(true);
          setQuitOpen(true);
        }}
      />

      <div className={styles.stageArea}>
        <Stage game={game} />

        {game.phase === 'zone' && <ZoneIntro game={game} />}
        {game.phase === 'knock' && (
          <p className={styles.toast} role="status">
            🚪 {TEXT.knockHint}
          </p>
        )}
        {game.phase === 'greeting' && <Greeting game={game} />}
        {inQuestion && <QuestionPanel game={game} />}
        {game.phase === 'reward' && <Reward key={planned.turnId} candies={game.lastCandies} />}
        {game.phase === 'turn_end' && <TurnEnd game={game} />}
        {notice && (
          <p className={clsx(styles.toast, styles.notice)} role="alert">
            {notice}
          </p>
        )}

        {game.paused && !quitOpen && (
          <div className={styles.overlay}>
            <div className={styles.card}>
              <h2>⏸ {TEXT.paused}</h2>
              <AudioToggles />
              <Button color="green" size="lg" onClick={() => halloweenActions.setPaused(false)}>
                <Icon name="play" size={24} /> {TEXT.resume}
              </Button>
            </div>
          </div>
        )}
      </div>

      {quitOpen && (
        <Dialog
          title={TEXT.quitTitle}
          image={MASCOT.encourage}
          onClose={() => {
            setQuitOpen(false);
            halloweenActions.setPaused(false);
          }}
          actions={
            <>
              <Button
                color="green"
                onClick={() => {
                  setQuitOpen(false);
                  halloweenActions.setPaused(false);
                }}
              >
                {TEXT.quitNo}
              </Button>
              <Button color="red" onClick={() => halloweenActions.quit()}>
                {TEXT.quitYes}
              </Button>
            </>
          }
        >
          <p>{TEXT.quitBody}</p>
        </Dialog>
      )}
    </div>
  );
}

function ZoneIntro({ game }: { game: Game }) {
  const planned = game.plan[game.turn];
  const zone = ZONES[planned.zone];
  return (
    <div className={styles.overlay}>
      <div className={clsx(styles.banner, styles[zone.id])}>
        <span className={styles.zoneNumber}>{TEXT.zoneTitle(planned.zone + 1)}</span>
        <h2>{zone.title}</h2>
        <Button color="cream" onClick={() => halloweenActions.zoneShown(planned.turnId)}>
          {TEXT.skip} <Icon name="next" size={20} />
        </Button>
      </div>
    </div>
  );
}

function Greeting({ game }: { game: Game }) {
  const planned = game.plan[game.turn];
  const npc = ZONES[planned.zone].houses[planned.house].npc;
  return (
    <button
      type="button"
      className={styles.greeting}
      onClick={() => halloweenActions.greeted(planned.turnId)}
    >
      <img src={portraitUrl(game.teams[planned.team].characterId)} alt="" />
      <span className={styles.speech}>{TEXT.trickOrTreat}</span>
      <img src={npcUrl(npc)} alt="" />
    </button>
  );
}

/** Kẹo bay lên giỏ trên HUD; 0 kẹo thì lời động viên nhẹ nhàng */
function Reward({ candies }: { candies: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: candies * 3 }, (_, index) => ({
      image: CANDIES[(index * 5 + candies) % CANDIES.length],
      dx: (index % 2 === 0 ? -1 : 1) * (20 + ((index * 37) % 120)),
      delay: index * 0.07,
    })),
  );
  return (
    <div className={styles.reward} aria-live="polite">
      <p className={clsx(styles.rewardText, candies === 0 && styles.soft)}>
        {candies > 0 ? `🍬 ${TEXT.candies(candies)}` : `🌟 ${TEXT.noCandy}`}
      </p>
      {pieces.map((piece, index) => (
        <img
          key={index}
          className={styles.candy}
          src={candyUrl(piece.image)}
          alt=""
          style={{ '--dx': `${piece.dx}px`, animationDelay: `${piece.delay}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}

/** Team: lượt xong -> dừng chờ giáo viên bấm NEXT TURN (không tự đổi đội) */
function TurnEnd({ game }: { game: Game }) {
  const planned = game.plan[game.turn];
  const next = game.plan[game.turn + 1];
  if (!next) return null;
  const team = game.teams[next.team];
  return (
    <div className={styles.overlay}>
      <div className={clsx(styles.card, styles.nextCard, styles[TEAM_TONES[next.team]])}>
        <span className={styles.upNext}>{TEXT.upNext}</span>
        <img className={styles.nextPortrait} src={portraitUrl(team.characterId)} alt="" />
        <h2>{team.name}</h2>
        <Button
          color="orange"
          size="lg"
          sfx={null}
          onClick={() => {
            playGameSfx(GAME_SFX.nextTurn);
            halloweenActions.nextTurn(planned.turnId);
          }}
        >
          {TEXT.nextTurn} <Icon name="next" size={24} />
        </Button>
      </div>
    </div>
  );
}
