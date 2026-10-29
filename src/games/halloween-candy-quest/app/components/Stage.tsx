/**
 * Sân khấu một khu vực: nền 320×180 + 4 ngôi nhà (cửa là vùng chạm lớn) + đồ vật trang trí bấm được + chủ nhà +
 * nhân vật tự đi tới nhà của lượt. Mọi toạ độ là px thế giới; cả khối được phóng / dời bằng một transform
 * (stageLayout.ts > cameraFor) nên pixel art luôn sắc nét và không méo.
 *
 * Thứ tự lớp (spec §14.3): nền -> nhà -> cửa / đồ vật -> nhân vật / chủ nhà -> hiệu ứng.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import CharacterSprite from '@/games/halloween-candy-quest/app/components/CharacterSprite';
import { GAME_SFX, playGameSfx } from '@/games/halloween-candy-quest/app/audio';
import {
  backgroundUrl,
  buildingUrl,
  doorUrl,
  fxUrl,
  npcUrl,
  propUrl,
} from '@/games/halloween-candy-quest/app/assets';
import { cameraFor, walkMs, walkPath } from '@/games/halloween-candy-quest/app/stageLayout';
import {
  CHARACTER_SIZE,
  DOOR_WIDTH,
  HOUSE_BOTTOM,
  HOUSE_SLOTS,
  HOUSE_WIDTH,
  WALK_LINE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  ZONES,
  type Pose,
  type Prop,
} from '@/games/halloween-candy-quest/content/world';
import { halloweenActions } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import type { Game } from '@/games/halloween-candy-quest/session/types';
import styles from '@/games/halloween-candy-quest/app/components/Stage.module.scss';

const DOOR_HEIGHT = (DOOR_WIDTH * 96) / 80;
const NPC_SIZE = 32;
/** Cửa mở từ lúc chủ nhà ra chào tới hết lượt */
const OPEN_PHASES: Game['phase'][] = ['greeting', 'question', 'feedback', 'reward', 'turn_end'];

function poseFor(game: Game): Pose {
  switch (game.phase) {
    case 'walk':
      return 'walk';
    case 'knocking':
      return 'knock';
    case 'feedback':
      return game.feedback === 'correct' ? 'celebrate' : 'try_again';
    case 'reward':
      return game.lastCandies > 0 ? 'celebrate' : 'idle';
    default:
      return 'idle';
  }
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export default function Stage({ game }: { game: Game }) {
  const [ref, size] = useSize<HTMLDivElement>();
  const planned = game.plan[game.turn];
  const zone = ZONES[planned.zone];
  const { from, to } = walkPath(game);
  const walking = game.phase === 'walk';
  const entering = game.phase === 'zone';
  const x = entering ? from : to;
  const duration = walkMs(from, to);
  // Đang đi: nhân vật + camera cùng trượt; vào khu vực mới: đặt ngay ở mép trái
  const transition = walking ? `${duration}ms linear` : entering ? 'none' : '300ms ease-out';
  const camera = cameraFor(size.width, size.height, x);
  const character = game.teams[planned.team].characterId;
  const doorOpen = OPEN_PHASES.includes(game.phase);
  const npcShown = doorOpen && game.phase !== 'turn_end';

  return (
    <div ref={ref} className={styles.viewport}>
      <div
        className={styles.world}
        style={{
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
          transition: `transform ${transition}`,
        }}
      >
        <img className={styles.background} src={backgroundUrl(zone.id)} alt="" draggable={false} />

        {zone.houses.map((house, index) => {
          const current = index === planned.house;
          const center = HOUSE_SLOTS[index];
          return (
            <div key={`${zone.id}-${index}`} className={clsx(styles.house, current && styles.currentHouse)}>
              <img
                className={styles.building}
                src={buildingUrl(house.building)}
                alt=""
                draggable={false}
                style={{
                  left: center - HOUSE_WIDTH / 2,
                  top: HOUSE_BOTTOM - HOUSE_WIDTH + 6,
                  width: HOUSE_WIDTH,
                }}
              />
              <div
                className={clsx(styles.doorway, current && doorOpen && styles.doorwayOpen)}
                style={{
                  left: center - DOOR_WIDTH / 2,
                  top: HOUSE_BOTTOM - DOOR_HEIGHT,
                  width: DOOR_WIDTH,
                  height: DOOR_HEIGHT,
                }}
              >
                <button
                  type="button"
                  className={clsx(
                    styles.door,
                    current && game.phase === 'knock' && !game.paused && styles.knockable,
                    current && game.phase === 'knocking' && styles.knocking,
                    current && doorOpen && styles.open,
                  )}
                  aria-label={current && game.phase === 'knock' ? TEXT.knockHint : undefined}
                  tabIndex={current && game.phase === 'knock' ? 0 : -1}
                  disabled={!current || game.phase !== 'knock' || game.paused}
                  onClick={() => {
                    if (halloweenActions.knock(planned.turnId)) playGameSfx(GAME_SFX.knock);
                  }}
                >
                  <img src={doorUrl(house.door)} alt="" draggable={false} />
                </button>
                {current && game.phase === 'knock' && (
                  <span className={styles.hand} aria-hidden="true">
                    👆
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {zone.props.map((prop) => (
          <PropButton
            key={`${zone.id}-${prop.id}`}
            prop={prop}
            enabled={['walk', 'knock'].includes(game.phase)}
          />
        ))}

        {npcShown && (
          <img
            className={styles.npc}
            src={npcUrl(zone.houses[planned.house].npc)}
            alt=""
            draggable={false}
            style={{
              left: HOUSE_SLOTS[planned.house] - NPC_SIZE / 2 + 4,
              top: HOUSE_BOTTOM - NPC_SIZE + 4,
              width: NPC_SIZE,
            }}
          />
        )}

        <div
          className={styles.walker}
          style={{
            left: x - CHARACTER_SIZE / 2,
            top: WALK_LINE - CHARACTER_SIZE,
            transition: `left ${transition}`,
          }}
        >
          <CharacterSprite
            id={character}
            pose={poseFor(game)}
            size={CHARACTER_SIZE}
            flip={walking && to < from}
          />
        </div>

        {game.phase === 'knocking' && (
          <img
            className={styles.spark}
            src={fxUrl('knock_spark')}
            alt=""
            style={
              { left: HOUSE_SLOTS[planned.house] - 16, top: HOUSE_BOTTOM - DOOR_HEIGHT - 6 } as CSSProperties
            }
          />
        )}
      </div>
    </div>
  );
}

/** Đồ vật trang trí: bấm thì đổi ảnh (bí ngô sáng đèn, rương mở) hoặc nảy lên — vui thôi, không cộng kẹo */
function PropButton({ prop, enabled }: { prop: Prop; enabled: boolean }) {
  const [toggled, setToggled] = useState(false);
  const [bounce, setBounce] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const image = toggled && prop.toggled ? prop.toggled : prop.image;
  return (
    <button
      type="button"
      className={clsx(styles.prop, bounce > 0 && styles.bounce)}
      key={bounce}
      tabIndex={-1}
      aria-hidden="true"
      disabled={!enabled}
      style={{
        left: prop.x - prop.width / 2,
        top: prop.y - prop.width,
        width: prop.width,
        height: prop.width,
      }}
      onClick={() => {
        if (prop.toggled) setToggled((value) => !value);
        setBounce((value) => value + 1);
        playGameSfx(prop.sound === 'chest_open' && !toggled ? GAME_SFX.chest : GAME_SFX.hint);
      }}
    >
      <img src={propUrl(image)} alt="" draggable={false} />
    </button>
  );
}
