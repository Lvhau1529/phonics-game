/**
 * Vật rơi — được tái sử dụng qua object pool (Arcade Group).
 * Không create/destroy liên tục: spawn*() để kích hoạt, despawn() để trả về pool.
 *
 * Hai loại:
 *   - letter: bánh chữ (`letter` là chữ THẬT, dùng để chấm đúng/sai)
 *   - hazard: vật cản của level HARD (trứng vỡ, bom)
 */
import Phaser from 'phaser';
import { DEPTH, SPAWN } from '@/games/bread-catcher/game/config/gameConfig';
import { HAZARDS, type HazardId } from '@/games/bread-catcher/game/config/hazards';
import { LETTER_TEXTURE_SCALE, ensureLetterTexture } from '@/games/bread-catcher/game/objects/letterTextures';
import type { ItemTrickState } from '@/games/bread-catcher/game/systems/troll/types';
import { isLandscape } from '@/core/phaser/view';

/** Hitbox nhỏ hơn sprite một chút cho cảm giác công bằng */
const HITBOX_RATIO = 0.7;
/** Tốc độ xoay tối đa (độ/giây) — nhẹ để chữ luôn dễ đọc */
const MAX_SPIN = 20;

export type ItemKind = 'letter' | 'hazard';

export default class FallingItem extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  kind: ItemKind = 'letter';
  /** Chữ thật (kể cả khi đang giả dạng chữ khác) */
  letter: string | null = null;
  hazard: HazardId | null = null;
  /** Kiểu bánh đang dùng (để vẽ lại khi đổi chữ) */
  private bread = '';
  /** Scale gốc: texture bánh chữ có độ phân giải gấp đôi; màn dọc nhỏ hơn (SPAWN.portraitItemScale) */
  private baseScale = 1;
  /** Trò troll đang gán (chỉ có ở level HARD) */
  trick: ItemTrickState | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '__DEFAULT');
  }

  get isLetter(): boolean {
    return this.kind === 'letter';
  }

  spawnLetter(letter: string, bread: string, x: number, y: number, speed: number): this {
    this.kind = 'letter';
    this.hazard = null;
    this.bread = bread;
    this.letter = letter;
    this.baseScale = LETTER_TEXTURE_SCALE * this.viewScale();
    this.setTexture(ensureLetterTexture(this.scene, bread, letter));
    return this.activate(x, y, speed);
  }

  spawnHazard(hazard: HazardId, x: number, y: number, speed: number): this {
    this.kind = 'hazard';
    this.hazard = hazard;
    this.letter = null;
    this.baseScale = this.viewScale();
    this.setTexture(HAZARDS[hazard].texture);
    return this.activate(x, y, speed);
  }

  /** Đổi hẳn sang chữ khác giữa đường (trò "swap") */
  changeLetter(letter: string): void {
    this.letter = letter;
    this.showLetter(letter);
  }

  /** Chỉ đổi hình hiển thị, chữ thật giữ nguyên (trò "giả dạng") */
  showLetter(letter: string): void {
    if (!this.isLetter) return;
    this.setTexture(ensureLetterTexture(this.scene, this.bread, letter));
  }

  /** Tắt va chạm ngay, chạy animation "rơi vào rổ" rồi trả về pool */
  collect(targetX: number, targetY: number): void {
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      scale: this.baseScale * 0.3,
      alpha: 0,
      duration: 120,
      ease: 'Quad.easeIn',
      onComplete: () => this.despawn(),
    });
  }

  /** Biến mất tại chỗ (xoá chữ khi chuyển từ) */
  vanish(): void {
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      scale: this.baseScale * 1.3,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => this.despawn(),
    });
  }

  despawn(): void {
    this.scene.tweens.killTweensOf(this);
    this.disableBody(true, true);
    this.letter = null;
    this.hazard = null;
    this.trick = null;
  }

  private viewScale(): number {
    return isLandscape(this.scene) ? 1 : SPAWN.portraitItemScale;
  }

  private activate(x: number, y: number, speed: number): this {
    this.trick = null;
    this.enableBody(true, x, y, true, true);
    this.setDepth(DEPTH.ITEMS).setAlpha(1).setScale(this.baseScale).clearTint();
    this.setAngle(Phaser.Math.Between(-8, 8));

    this.body.setAllowGravity(false).setGravityY(0);
    this.body.setSize(this.width * HITBOX_RATIO, this.height * HITBOX_RATIO, true);
    this.setVelocity(0, speed);
    this.setAngularVelocity(Phaser.Math.Between(-MAX_SPIN, MAX_SPIN));
    return this;
  }
}
