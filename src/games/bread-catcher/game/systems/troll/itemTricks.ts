/**
 * Trò "láo" của từng chữ rơi (level HARD).
 * Thông số ở config/troll.ts > TROLL_ITEMS.
 */
import Phaser from 'phaser';
import { THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { TROLL_ITEMS, type ItemTrickId } from '@/games/bread-catcher/game/config/troll';
import { view } from '@/core/phaser/view';
import type FallingItem from '@/games/bread-catcher/game/objects/FallingItem';
import type { ItemTrick, ItemTrickState, TrollContext } from '@/games/bread-catcher/game/systems/troll/types';

const { colors } = THEME;
/** Giữ chữ cách mép màn hình ít nhất ngần này (px) */
export const EDGE = 36;

/** Đã rơi qua `ratio` chiều cao màn hình và chưa kích hoạt */
const passed = (item: FallingItem, state: ItemTrickState, ctx: TrollContext, ratio: number) =>
  !state.triggered && item.y >= view(ctx.scene).height * ratio;

export const ITEM_TRICKS: Record<ItemTrickId, ItemTrick> = {
  /** Né rổ khi rơi tới gần */
  dodge: {
    update: (item, state, { basket, scene, effects }, delta) => {
      const config = TROLL_ITEMS.dodge;
      if (state.triggered) {
        state.dashRemaining -= delta;
        if (state.dashRemaining <= 0) item.body.velocity.x = 0;
        return;
      }

      const closeY = item.y > basket.rimY - config.triggerDistanceY;
      const aboveBasket = Math.abs(item.x - basket.x) < basket.displayWidth / 2;
      if (!closeY || !aboveBasket) return;

      // Né về phía xa rổ; sát mép thì né ngược lại
      let direction = item.x >= basket.x ? 1 : -1;
      const room = direction > 0 ? view(scene).width - item.x : item.x;
      if (room < 80) direction = -direction;

      state.triggered = true;
      state.dashRemaining = config.dashMs;
      item.body.velocity.x = direction * config.dashSpeed;
      effects.popup(item.x, item.y - 20, config.label, colors.pink);
    },
  },

  /** x = x0 + A·sin(ωt)  =>  vx = A·ω·cos(ωt) */
  zigzag: {
    assign: (item, { scene }) => {
      const margin = TROLL_ITEMS.zigzag.amplitude + EDGE;
      item.x = Phaser.Math.Clamp(item.x, margin, view(scene).width - margin);
    },
    update: (item, state) => {
      const { amplitude, frequency } = TROLL_ITEMS.zigzag;
      item.body.velocity.x = amplitude * frequency * Math.cos((frequency * state.elapsed) / 1000);
    },
  },

  /** Đột ngột tăng tốc */
  sprint: {
    update: (item, state, ctx) => {
      if (!passed(item, state, ctx, TROLL_ITEMS.sprint.triggerRatio)) return;
      state.triggered = true;
      item.body.velocity.y *= TROLL_ITEMS.sprint.multiplier;
    },
  },

  /** Chữ cần hứng hoá thành chữ khác giữa đường */
  swap: {
    update: (item, state, ctx) => {
      if (!passed(item, state, ctx, TROLL_ITEMS.swap.triggerRatio) || !item.letter) return;
      state.triggered = true;
      item.changeLetter(ctx.spawner.randomDistractor(item.letter));
      ctx.effects.catchBurst(item.x, item.y);
      ctx.effects.popup(item.x, item.y - 24, TROLL_ITEMS.swap.label, colors.red);
    },
  },

  /** Chữ nhiễu bám theo rổ */
  homing: {
    update: (item, _state, { basket }) => {
      const { maxSpeed } = TROLL_ITEMS.homing;
      item.body.velocity.x = Phaser.Math.Clamp((basket.x - item.x) * 2, -maxSpeed, maxSpeed);
    },
  },

  /** Biến mất rồi hiện ra chỗ khác, xa rổ */
  teleport: {
    update: (item, state, ctx) => {
      if (!passed(item, state, ctx, TROLL_ITEMS.teleport.triggerRatio)) return;
      state.triggered = true;

      const { minDistance, label } = TROLL_ITEMS.teleport;
      const { basket, effects, scene } = ctx;
      let x = item.x;
      for (let tries = 0; tries < 8; tries += 1) {
        x = Phaser.Math.Between(EDGE, view(scene).width - EDGE);
        if (Math.abs(x - basket.x) >= minDistance) break;
      }
      effects.catchBurst(item.x, item.y);
      effects.popup(item.x, item.y - 20, label, colors.pink);
      item.x = x;
      scene.tweens.add({ targets: item, alpha: { from: 0, to: 1 }, duration: 200 });
    },
  },

  /** Chạm miệng rổ thì nảy ra ngoài (một lần) */
  bounce: {
    interceptCatch: (item, state, { effects }) => {
      // Đang bay lên sau cú nảy thì chưa cho hứng; rơi xuống lại mới được
      if (state.triggered) return item.body.velocity.y < 0;
      state.triggered = true;

      const { launchSpeed, sideSpeed, gravity, label } = TROLL_ITEMS.bounce;
      item.body.setAllowGravity(true).setGravityY(gravity);
      item.body.setVelocity(Phaser.Math.Between(-sideSpeed, sideSpeed), -launchSpeed);
      effects.popup(item.x, item.y - 20, label, colors.gold);
      return true;
    },
  },

  /** Mờ gần như vô hình (vẫn hứng được) */
  ghost: {
    update: (item, state, ctx) => {
      if (!passed(item, state, ctx, TROLL_ITEMS.ghost.triggerRatio)) return;
      state.triggered = true;
      const { alpha, fadeMs } = TROLL_ITEMS.ghost;
      ctx.scene.tweens.add({ targets: item, alpha, duration: fadeMs });
    },
  },

  /** Chữ nhiễu giả dạng chữ cần hứng, lộ mặt thật giữa đường */
  disguise: {
    assign: (item, { spawner }) => {
      if (spawner.expectedLetter) item.showLetter(spawner.expectedLetter);
    },
    update: (item, state, ctx) => {
      if (!passed(item, state, ctx, TROLL_ITEMS.disguise.revealRatio) || !item.letter) return;
      state.triggered = true;
      item.showLetter(item.letter);
      ctx.effects.popup(item.x, item.y - 24, TROLL_ITEMS.disguise.label, colors.red);
    },
  },
};
