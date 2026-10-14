/**
 * Logic troll — chỉ được tạo khi level là HARD.
 *
 * Điều phối 2 nhóm trò:
 *   1. Prank toàn màn hình (pranks.ts, brainrotPranks.ts): lần lượt từng cái, hồi chiêu ngắn.
 *   2. Trò của chữ rơi (itemTricks.ts): gán ngẫu nhiên lúc spawn —
 *      chữ CẦN hứng thì né / nảy / đổi chữ, chữ nhiễu thì đuổi theo rổ / giả dạng.
 *
 * Thêm trò mới: khai báo thông số trong config/troll.ts rồi thêm handler
 * vào pranks.ts / itemTricks.ts — không cần sửa file này.
 */
import Phaser from 'phaser';
import {
  TROLL_ITEMS,
  TROLL_PRANKS,
  type ItemTrickId,
  type PrankId,
} from '@/games/bread-catcher/game/config/troll';
import { view } from '@/core/phaser/view';
import type FallingItem from '@/games/bread-catcher/game/objects/FallingItem';
import { EDGE, ITEM_TRICKS } from '@/games/bread-catcher/game/systems/troll/itemTricks';
import { PRANKS } from '@/games/bread-catcher/game/systems/troll/pranks';
import type { TrollContext } from '@/games/bread-catcher/game/systems/troll/types';
import { pickWeighted } from '@/core/utils/random';

const PRANK_WEIGHTS = Object.fromEntries(
  Object.entries(TROLL_PRANKS.list).map(([id, prank]) => [id, prank.weight]),
) as Record<PrankId, number>;

export default class TrollSystem {
  private elapsed = 0;
  private nextPrankAt = TROLL_PRANKS.graceMs;
  private enabled = true;
  /** Hàm hoàn tác prank đang chạy (null = không có prank) */
  private undoActivePrank: (() => void) | null = null;
  private prankTimer: Phaser.Time.TimerEvent | null = null;

  constructor(private readonly ctx: TrollContext) {
    ctx.bus.on('item-spawned', (item) => this.assignTrick(item));
  }

  update(delta: number): void {
    if (!this.enabled) return;
    this.elapsed += delta;
    this.updateItems(delta);

    // Không prank lúc chuyển từ / đếm ngược (spawner đang dừng)
    const canPrank = !this.undoActivePrank && !this.ctx.spawner.isPaused;
    if (canPrank && this.elapsed >= this.nextPrankAt) this.startPrank();
  }

  /** Tắt hẳn (hết lượt / rời game): hoàn tác prank đang chạy */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.finishPrank();
  }

  /** Gọi trước khi rổ hứng; true = trò của chữ huỷ lần hứng này */
  interceptCatch(item: FallingItem): boolean {
    if (!item.trick) return false;
    return ITEM_TRICKS[item.trick.id].interceptCatch?.(item, item.trick, this.ctx) ?? false;
  }

  // -------------------------------------------------------------------------
  // Pranks
  // -------------------------------------------------------------------------
  private startPrank(): void {
    const run = PRANKS[pickWeighted<PrankId>(PRANK_WEIGHTS)](this.ctx);
    this.undoActivePrank = run.undo ?? (() => undefined);
    this.prankTimer = this.ctx.scene.time.delayedCall(run.duration, () => this.finishPrank());
  }

  private finishPrank(): void {
    this.prankTimer?.remove();
    this.prankTimer = null;
    if (!this.undoActivePrank) return;

    this.undoActivePrank();
    this.undoActivePrank = null;
    const { min, max } = TROLL_PRANKS.cooldownMs;
    this.nextPrankAt = this.elapsed + Phaser.Math.Between(min, max);
  }

  // -------------------------------------------------------------------------
  // Item tricks
  // -------------------------------------------------------------------------
  private assignTrick(item: FallingItem): void {
    if (!this.enabled || !item.isLetter || this.elapsed < TROLL_PRANKS.graceMs) return;
    if (Math.random() > TROLL_ITEMS.chance) return;

    const isExpected = item.letter === this.ctx.spawner.expectedLetter;
    const id = pickWeighted<ItemTrickId>(
      isExpected ? TROLL_ITEMS.expectedTricks : TROLL_ITEMS.distractorTricks,
    );
    item.trick = { id, triggered: false, elapsed: 0, dashRemaining: 0 };
    ITEM_TRICKS[id].assign?.(item, this.ctx);
  }

  private updateItems(delta: number): void {
    const maxX = view(this.ctx.scene).width - EDGE;
    this.ctx.spawner.activeItems.forEach((item) => {
      if (!item.trick || !item.body.enable) return;
      item.trick.elapsed += delta;
      ITEM_TRICKS[item.trick.id].update?.(item, item.trick, this.ctx, delta);

      // Không cho trò nào đẩy chữ ra khỏi màn hình
      if (item.x < EDGE || item.x > maxX) {
        item.x = Phaser.Math.Clamp(item.x, EDGE, maxX);
        item.body.velocity.x = 0;
      }
    });
  }
}
