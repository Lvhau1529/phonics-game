/**
 * Prank toàn màn hình của level HARD.
 * Mỗi prank: bắt đầu ngay, trả về thời lượng + hàm hoàn tác.
 * Thông số ở config/troll.ts > TROLL_PRANKS.
 */
import Phaser from 'phaser';
import { SFX } from '@/core/audio/sfx';
import { DEPTH, SPAWN, THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { TROLL_PRANKS, type PrankId } from '@/games/bread-catcher/game/config/troll';
import { view } from '@/core/phaser/view';
import { BRAINROT_PRANKS } from '@/games/bread-catcher/game/systems/troll/brainrotPranks';
import type { Prank } from '@/games/bread-catcher/game/systems/troll/types';
import { addText } from '@/games/bread-catcher/game/ui/text';

const { list } = TROLL_PRANKS;
const { colors } = THEME;

/** Thời gian giữ chữ thông báo cho các prank "tức thì" */
const ANNOUNCE_MS = 1200;

export const PRANKS: Record<PrankId, Prank> = {
  reverse: ({ controls, effects }) => {
    controls.setInverted(true);
    effects.announce(list.reverse.label);
    return { duration: list.reverse.duration, undo: () => controls.setInverted(false) };
  },

  tinyBasket: ({ basket, effects }) => {
    basket.setSizeScale(list.tinyBasket.scale);
    effects.announce(list.tinyBasket.label);
    return { duration: list.tinyBasket.duration, undo: () => basket.setSizeScale(1) };
  },

  fakeBonus: ({ scene, audio, effects }) => {
    const { label, reveal, revealDelay } = list.fakeBonus;
    audio.playSfx(SFX.WORD_COMPLETE);
    effects.announce(label, colors.gold, { holdMs: revealDelay - 260 });
    scene.time.delayedCall(revealDelay, () => {
      audio.playSfx(SFX.WRONG_LETTER);
      effects.announce(reveal, colors.pink);
      effects.shake('light');
    });
    return { duration: revealDelay + ANNOUNCE_MS };
  },

  flip: ({ scene, effects }) => {
    const camera = scene.cameras.main;
    const rotateTo = (rotation: number) =>
      scene.tweens.add({ targets: camera, rotation, duration: 400, ease: 'Back.easeOut' });
    rotateTo(Math.PI);
    effects.announce(list.flip.label);
    return { duration: list.flip.duration, undo: () => rotateTo(0) };
  },

  lightsOut: ({ scene, effects }) => {
    const { width, height } = view(scene);
    const darkness = scene.add
      .rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000, list.lightsOut.darkness)
      .setDepth(DEPTH.DARKNESS)
      .setAlpha(0);
    scene.tweens.add({ targets: darkness, alpha: 1, duration: 200 });
    effects.announce(list.lightsOut.label, colors.gold);
    return {
      duration: list.lightsOut.duration,
      undo: () =>
        scene.tweens.add({
          targets: darkness,
          alpha: 0,
          duration: 250,
          onComplete: () => darkness.destroy(),
        }),
    };
  },

  fakeTimesUp: ({ scene, audio }) => {
    const { width, height } = view(scene);
    const { label, reveal, duration } = list.fakeTimesUp;
    const dim = scene.add
      .rectangle(width / 2, height / 2, width * 2, height * 2, 0x1e0c04, 0.7)
      .setDepth(DEPTH.BANNER);
    const text = addText(scene, width / 2, height * 0.45, label, 'title', {
      fontSize: '42px',
      color: colors.red,
    }).setDepth(DEPTH.BANNER);
    audio.playSfx(SFX.TIME_UP);

    scene.time.delayedCall(duration, () => {
      if (!text.active) return; // đã bị huỷ sớm (vd: hết lượt thật)
      text.setText(reveal).setColor(colors.pink);
      audio.playSfx(SFX.WRONG_LETTER);
    });
    const cleanup = () => {
      dim.destroy();
      text.destroy();
    };
    return { duration: duration + 700, undo: cleanup };
  },

  windy: ({ basket, effects }) => {
    const direction = Math.random() < 0.5 ? -1 : 1;
    basket.setWind(direction * list.windy.speed);
    effects.announce(`${list.windy.label} ${direction > 0 ? '>>>' : '<<<'}`, colors.cream);
    return { duration: list.windy.duration, undo: () => basket.setWind(0) };
  },

  earthquake: ({ scene, effects }) => {
    const camera = scene.cameras.main;
    camera.shake(list.earthquake.duration, list.earthquake.intensity);
    effects.announce(list.earthquake.label, colors.gold);
    return { duration: list.earthquake.duration, undo: () => camera.shakeEffect.reset() };
  },

  eggStorm: ({ scene, spawner, effects }) => {
    const { count, label } = list.eggStorm;
    const width = view(scene).width - SPAWN.edgeMargin * 2;
    for (let i = 0; i < count; i += 1) {
      const x = SPAWN.edgeMargin + (width / (count - 1)) * i + Phaser.Math.Between(-10, 10);
      scene.time.delayedCall(i * 90, () => spawner.spawnHazard('egg_broken', x));
    }
    effects.announce(label, colors.red);
    return { duration: ANNOUNCE_MS };
  },

  turbo: ({ scene, effects }) => {
    scene.physics.world.timeScale = list.turbo.timeScale;
    effects.announce(list.turbo.label, colors.gold);
    return {
      duration: list.turbo.duration,
      undo: () => {
        scene.physics.world.timeScale = 1;
      },
    };
  },

  // Nhân vật brainrot (brainrotPranks.ts)
  ...BRAINROT_PRANKS,
};
