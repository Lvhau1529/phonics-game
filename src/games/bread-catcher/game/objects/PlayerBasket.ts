/**
 * Rổ hứng — chỉ di chuyển ngang, không ra khỏi màn hình.
 * Vùng va chạm là dải mỏng ở miệng rổ, rộng CỐ ĐỊNH (PLAYER.catchZone) cho mọi tier.
 * Arcade body co giãn theo scale, nên cả cỡ theo hướng màn hình (`viewScale`: màn dọc nhỏ hơn) lẫn
 * `setSizeScale` (prank rổ teo) đều thu nhỏ luôn vùng hứng.
 */
import Phaser from 'phaser';
import { DEPTH, PLAYER, TIMING } from '@/games/bread-catcher/game/config/gameConfig';
import { PORTRAIT } from '@/core/phaser/viewport';
import { BASKET_TEXTURES, type BasketTier } from '@/games/bread-catcher/game/config/stages';
import { isLandscape, view } from '@/core/phaser/view';
import type InputController from '@/games/bread-catcher/game/systems/InputController';

export default class PlayerBasket extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;
  tier: BasketTier;
  /** Cỡ theo hướng màn hình: ngang 1, dọc PLAYER.portraitScale */
  private readonly viewScale: number;
  /** Hệ số của prank (1 = bình thường) */
  private sizeScale = 1;
  private sizeTween: Phaser.Tweens.Tween | null = null;
  /** Lực đẩy ngang (px/s) cộng thêm mỗi frame — prank "gió" */
  private wind = 0;
  private frozenTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, tier: BasketTier = 1) {
    super(scene, x, y, BASKET_TEXTURES[tier]);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.tier = tier;
    this.viewScale = isLandscape(scene) ? 1 : PLAYER.portraitScale;
    this.setOrigin(0.5, 1).setDepth(DEPTH.BASKET).setScale(this.viewScale);
    this.body.setAllowGravity(false).setImmovable(true);
    this.updateBody();
  }

  /** Toạ độ Y của miệng rổ (dùng cho popup / hiệu ứng) */
  get rimY(): number {
    return this.y - this.displayHeight * (1 - PLAYER.catchZone.topRatio);
  }

  /** Scale lúc nghỉ; các tween squash / pop tính quanh giá trị này */
  private get restScale(): number {
    return this.viewScale * this.sizeScale;
  }

  get isFrozen(): boolean {
    return this.frozenTimer !== null;
  }

  /** Đổi tier (phần thưởng hình ảnh) kèm hiệu ứng "pop" */
  setTier(tier: BasketTier): void {
    if (tier === this.tier) return;
    this.tier = tier;
    this.setTexture(BASKET_TEXTURES[tier]);
    this.updateBody();
    this.x = this.clampX(this.x);
    this.scene.tweens.add({
      targets: this,
      scaleX: { from: this.restScale * 1.3, to: this.restScale },
      scaleY: { from: this.restScale * 1.3, to: this.restScale },
      duration: 350,
      ease: 'Back.easeOut',
    });
  }

  /** Đứng im hoàn toàn trong `duration` ms (choáng / đóng băng) */
  freeze(duration: number): void {
    this.frozenTimer?.remove();
    this.frozenTimer = this.scene.time.delayedCall(duration, () => {
      this.frozenTimer = null;
      this.refreshTint();
    });
    this.refreshTint();
  }

  /** Bị đánh văng ngang `distance` px */
  knock(distance: number): void {
    this.scene.tweens.add({
      targets: this,
      x: this.clampX(this.x + distance),
      duration: 220,
      ease: 'Quad.easeOut',
    });
  }

  /** Phóng to / thu nhỏ rổ (prank rổ teo) */
  setSizeScale(scale: number): void {
    this.sizeScale = scale;
    this.sizeTween?.stop();
    this.sizeTween = this.scene.tweens.add({
      targets: this,
      scale: this.restScale,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  setWind(speed: number): void {
    this.wind = speed;
  }

  /** scaleY 1 → 0.90 → 1.05 → 1 (~150ms) khi hứng */
  squash(): void {
    const step = TIMING.basketSquash / 3;
    const s = this.restScale;
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        { scaleY: s * 0.9, scaleX: s * 1.06, duration: step, ease: 'Quad.easeOut' },
        { scaleY: s * 1.05, scaleX: s * 0.98, duration: step, ease: 'Quad.easeOut' },
        { scaleY: s, scaleX: s, duration: step, ease: 'Quad.easeIn' },
      ],
    });
  }

  /** Nảy lên ăn mừng khi xong từ */
  celebrate(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 18,
      duration: 160,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
    });
  }

  /** Lắc nhẹ khi hứng nhầm (plan §13: phản hồi nhẹ nhàng) */
  shake(): void {
    this.scene.tweens.add({
      targets: this,
      angle: { from: -8, to: 8 },
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.setAngle(0),
    });
  }

  move(delta: number, input: InputController): void {
    if (this.isFrozen) return;
    const dt = delta / 1000;
    const direction = input.direction;

    if (direction !== 0) {
      // Màn ngang rộng hơn -> bàn phím nhanh hơn tương ứng
      const widthFactor = Math.sqrt(view(this.scene).width / PORTRAIT.width);
      this.x += direction * PLAYER.keyboardSpeed * widthFactor * dt;
    } else if (input.targetX !== null) {
      const maxStep = PLAYER.pointerMaxSpeed * dt;
      this.x += Phaser.Math.Clamp(input.targetX - this.x, -maxStep, maxStep);
    }
    this.x = this.clampX(this.x + this.wind * dt);
  }

  private refreshTint(): void {
    if (this.isFrozen) this.setTint(PLAYER.frozenTint);
    else this.clearTint();
  }

  private clampX(x: number): number {
    const half = (this.width * this.restScale) / 2;
    return Phaser.Math.Clamp(x, half, view(this.scene).width - half);
  }

  private updateBody(): void {
    const { width, height, topRatio } = PLAYER.catchZone;
    this.body.setSize(width, height, false);
    this.body.setOffset((this.width - width) / 2, this.height * topRatio);
  }
}
