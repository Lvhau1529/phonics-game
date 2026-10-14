/**
 * Prank "nhân vật brainrot" của level HARD: nhân vật chạy vào màn hình và phá game.
 *   Tung Tung Tung Sahur · Lirili Larila · Tralalero Tralala · Bombardiro Crocodilo
 * Mỗi nhân vật tự cập nhật theo event UPDATE của scene; hoàn tác = dọn nhân vật.
 */
import Phaser from 'phaser';
import { SFX } from '@/core/audio/sfx';
import { DEPTH, THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { TROLL_PRANKS } from '@/games/bread-catcher/game/config/troll';
import { view } from '@/core/phaser/view';
import { hudLayout } from '@/games/bread-catcher/game/ui/layout';
import { BRAINROT } from '@/games/bread-catcher/game/objects/brainrot';
import type FallingItem from '@/games/bread-catcher/game/objects/FallingItem';
import type { Prank, TrollContext } from '@/games/bread-catcher/game/systems/troll/types';

const { tungSahur, lirili, tralalero, bombardiro } = TROLL_PRANKS.list;
const { colors } = THEME;

/** Khoảng ngoài màn hình nhân vật xuất hiện / biến mất (px) */
const OFFSCREEN = 50;

type UpdateHandler = (time: number, delta: number) => void;

/** Chạy `handler` mỗi frame cho tới khi gọi hàm trả về */
function everyFrame(scene: Phaser.Scene, handler: UpdateHandler): () => void {
  scene.events.on(Phaser.Scenes.Events.UPDATE, handler);
  return () => scene.events.off(Phaser.Scenes.Events.UPDATE, handler);
}

/** Đi từ phía xa rổ hơn để người chơi kịp thấy mà hoảng */
function entrySide({ scene, basket }: TrollContext): { startX: number; direction: 1 | -1 } {
  const { width } = view(scene);
  const fromLeft = basket.x > width / 2;
  return fromLeft ? { startX: -OFFSCREEN, direction: 1 } : { startX: width + OFFSCREEN, direction: -1 };
}

const crossingMs = (scene: Phaser.Scene, speed: number) =>
  ((view(scene).width + OFFSCREEN * 2) / speed) * 1000;

// ---------------------------------------------------------------------------
// Tung Tung Tung Sahur: chạy dọc đáy màn hình, BONK văng rổ + làm choáng
// ---------------------------------------------------------------------------
const tungTungTungSahur: Prank = (ctx) => {
  const { scene, basket, effects, audio } = ctx;
  const { startX, direction } = entrySide(ctx);

  const tung = scene.add
    .sprite(startX, basket.y, BRAINROT.tung.idle)
    .setOrigin(0.5, 1)
    .setDepth(DEPTH.BASKET + 1)
    .setFlipX(direction < 0) // sprite gốc quay sang phải
    .play(BRAINROT.tung.walk);

  effects.announce(tungSahur.label, colors.gold);
  // "tung... tung... tung..."
  [0, 180, 360].forEach((delay) =>
    scene.time.delayedCall(delay, () => audio.playSfx(SFX.UI_CLICK, { rate: 0.55, volumeScale: 2 })),
  );

  let hasHit = false;
  const stop = everyFrame(scene, (_time, delta) => {
    tung.x += (direction * tungSahur.speed * delta) / 1000;
    if (hasHit || Math.abs(tung.x - basket.x) > tungSahur.hitRange) return;

    hasHit = true;
    tung.stop().setTexture(BRAINROT.tung.hit);
    basket.knock(direction * tungSahur.knockback);
    basket.freeze(tungSahur.stunMs);
    effects.shake('strong');
    effects.popup(basket.x, basket.rimY - 30, tungSahur.hitLabel, colors.red);
    audio.playSfx(SFX.WRONG_LETTER);
    scene.time.delayedCall(250, () => tung.active && tung.play(BRAINROT.tung.walk));
  });

  return {
    duration: crossingMs(scene, tungSahur.speed),
    undo: () => {
      stop();
      tung.destroy();
    },
  };
};

// ---------------------------------------------------------------------------
// Lirili Larila: đi ngang giữa màn hình, TIME STOP đóng băng rổ, ăn vụng chữ rơi
// ---------------------------------------------------------------------------
const liriliLarila: Prank = (ctx) => {
  const { scene, basket, spawner, effects, audio } = ctx;
  const { startX, direction } = entrySide(ctx);

  const walker = scene.add
    .sprite(startX, view(scene).height * 0.55, BRAINROT.lirili.idle)
    .setDepth(DEPTH.ITEMS + 1)
    .setFlipX(direction < 0)
    .play(BRAINROT.lirili.walk);
  effects.announce(lirili.label, colors.green);

  // Đồng hồ đứng trên rổ trong lúc "dừng thời gian"
  let clock: Phaser.GameObjects.Image | null = null;
  scene.time.delayedCall(lirili.freezeDelayMs, () => {
    if (!walker.active) return;
    basket.freeze(lirili.freezeMs);
    audio.playSfx(SFX.CORRECT_LETTER, { rate: 0.7 });
    effects.popup(basket.x, basket.rimY - 50, lirili.freezeLabel, colors.cream);
    clock = scene.add.image(basket.x, basket.rimY - 30, BRAINROT.clock).setDepth(DEPTH.FX);
    scene.tweens.add({ targets: clock, angle: 360, duration: 900, repeat: -1 });
    scene.time.delayedCall(lirili.freezeMs, () => clock?.destroy());
  });

  const stop = everyFrame(scene, (_time, delta) => {
    walker.x += (direction * lirili.speed * delta) / 1000;
    clock?.setPosition(basket.x, basket.rimY - 30);

    // Ăn vụng mọi thứ rơi qua người
    spawner.activeItems.forEach((item) => {
      if (!item.body.enable) return;
      if (Phaser.Math.Distance.Between(item.x, item.y, walker.x, walker.y) > lirili.eatRadius) return;
      effects.popup(item.x, item.y - 16, lirili.eatLabel, colors.green);
      item.despawn();
    });
  });

  return {
    duration: crossingMs(scene, lirili.speed),
    undo: () => {
      stop();
      walker.destroy();
      clock?.destroy();
    },
  };
};

// ---------------------------------------------------------------------------
// Tralalero Tralala: lao ngang giữa màn hình, đá văng mọi chữ đang rơi
// ---------------------------------------------------------------------------
const tralaleroTralala: Prank = (ctx) => {
  const { scene, spawner, effects, audio } = ctx;
  const { startX, direction } = entrySide(ctx);

  const shark = scene.add
    .sprite(startX, view(scene).height * tralalero.yRatio, BRAINROT.tralalero.idle)
    .setDepth(DEPTH.ITEMS + 1)
    .setFlipX(direction < 0)
    .play(BRAINROT.tralalero.walk);
  effects.announce(tralalero.label, colors.cream);
  audio.playSfx(SFX.TEAM_SELECTED, { rate: 1.3 });

  const kicked = new WeakSet<FallingItem>();
  const stop = everyFrame(scene, (_time, delta) => {
    shark.x += (direction * tralalero.speed * delta) / 1000;

    spawner.activeItems.forEach((item) => {
      if (!item.body.enable || kicked.has(item)) return;
      if (Phaser.Math.Distance.Between(item.x, item.y, shark.x, shark.y) > tralalero.kickRadius) return;

      kicked.add(item);
      item.body.setAllowGravity(true).setGravityY(tralalero.kickGravity);
      item.body.setVelocity(direction * tralalero.kickSpeed, -tralalero.kickSpeed);
      item.setAngularVelocity(direction * 400);
      effects.popup(item.x, item.y - 16, tralalero.kickLabel, colors.gold);
      audio.playSfx(SFX.UI_CLICK, { rate: 1.4 });
    });
  });

  return {
    duration: crossingMs(scene, tralalero.speed),
    undo: () => {
      stop();
      shark.destroy();
    },
  };
};

// ---------------------------------------------------------------------------
// Bombardiro Crocodilo: bay ngang phía trên, thả bom
//   - hứng bom: nổ + rổ choáng (GameScene xử lý theo HAZARDS.bomb)
//   - bom rơi xuống đất: nổ, rổ ở gần bị hất văng + choáng
// ---------------------------------------------------------------------------
/** Chờ thêm để quả bom cuối kịp rơi xuống đất trước khi dọn prank */
const BOMB_FALL_BUFFER_MS = 3000;

const bombardiroCrocodilo: Prank = (ctx) => {
  const { scene, bus, basket, spawner, effects, audio } = ctx;
  const { startX, direction } = entrySide(ctx);
  const { width, height } = view(scene);

  const plane = scene.add
    .sprite(startX, hudLayout(scene).playTop + bombardiro.altitudeBelowHud, BRAINROT.bombardiro.idle)
    .setDepth(DEPTH.HUD - 2)
    .setFlipX(direction < 0)
    .play(BRAINROT.bombardiro.walk);
  effects.announce(bombardiro.label, colors.red);

  // Điểm thả bom trải đều trên đường bay; một quả nhắm thẳng vào rổ
  const margin = 30;
  const dropXs = Array.from(
    { length: bombardiro.bombs },
    (_, i) => margin + ((width - margin * 2) * (i + 0.5)) / bombardiro.bombs + Phaser.Math.Between(-20, 20),
  );
  const nearest = dropXs.reduce(
    (best, x, i) => (Math.abs(x - basket.x) < Math.abs(dropXs[best] - basket.x) ? i : best),
    0,
  );
  dropXs[nearest] = Phaser.Math.Clamp(basket.x, margin, width - margin);
  dropXs.sort((a, b) => (a - b) * direction); // theo thứ tự máy bay bay qua

  const explode = (x: number, y: number) => {
    effects.explosion(x, y);
    effects.popup(x, y - 30, bombardiro.blastLabel, colors.red);
    audio.playSfx(SFX.WRONG_LETTER, { rate: 0.6 });
  };
  const onMissed = (item: FallingItem) => {
    if (item.hazard !== 'bomb') return;
    explode(item.x, height - 12);
    const distance = basket.x - item.x;
    if (Math.abs(distance) > bombardiro.blastRadius) return;
    basket.knock(Math.sign(distance || 1) * bombardiro.knockback);
    basket.freeze(bombardiro.stunMs);
  };
  bus.on('item-missed', onMissed);

  let nextDrop = 0;
  const stop = everyFrame(scene, (_time, delta) => {
    plane.x += (direction * bombardiro.speed * delta) / 1000;
    const passed = (x: number) => (direction > 0 ? plane.x >= x : plane.x <= x);
    while (nextDrop < dropXs.length && passed(dropXs[nextDrop])) {
      spawner.spawnHazard('bomb', dropXs[nextDrop], {
        y: plane.y + 20,
        speedScale: bombardiro.bombSpeedScale,
      });
      audio.playSfx(SFX.UI_CLICK, { rate: 0.5 });
      nextDrop += 1;
    }
  });

  return {
    duration: crossingMs(scene, bombardiro.speed) + BOMB_FALL_BUFFER_MS,
    undo: () => {
      stop();
      plane.destroy();
      bus.off('item-missed', onMissed);
    },
  };
};

export const BRAINROT_PRANKS = {
  tungSahur: tungTungTungSahur,
  lirili: liriliLarila,
  tralalero: tralaleroTralala,
  bombardiro: bombardiroCrocodilo,
} satisfies Record<string, Prank>;
