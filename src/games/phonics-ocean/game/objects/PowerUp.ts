/**
 * Vật phẩm trôi trong nước (bảng power-up của pack): bong bóng bảo vệ, đồng hồ +10 giây, tim +1.
 * Trôi chậm từ dưới lên, lắc lư; không nhặt thì mờ dần rồi biến mất.
 */
import Phaser from 'phaser';
import { DEPTH, FEEL } from '@/games/phonics-ocean/game/config/theme';

export type PowerUpKind = 'bubble' | 'clock' | 'heart';

const SIZE = 30;

export default class PowerUp extends Phaser.GameObjects.Image {
  private collected = false;

  constructor(
    scene: Phaser.Scene,
    readonly kind: PowerUpKind,
    x: number,
    bounds: Phaser.Geom.Rectangle,
  ) {
    super(scene, x, bounds.bottom - 10, `item.${kind}`);
    this.setScale(SIZE / Math.max(this.width, this.height))
      .setDepth(DEPTH.ITEMS)
      .setAlpha(0);
    scene.add.existing(this);
    scene.tweens.add({ targets: this, alpha: 1, duration: 300 });
    scene.tweens.add({
      targets: this,
      y: bounds.y + bounds.height * Phaser.Math.FloatBetween(0.25, 0.55),
      duration: FEEL.powerUpLifeMs,
      ease: 'Sine.easeOut',
    });
    scene.tweens.add({ targets: this, angle: { from: -8, to: 8 }, duration: 700, yoyo: true, repeat: -1 });
    scene.time.delayedCall(FEEL.powerUpLifeMs, () => {
      if (this.collected || !this.active) return;
      scene.tweens.add({ targets: this, alpha: 0, duration: 500, onComplete: () => this.destroy() });
    });
  }

  get radius(): number {
    return SIZE * 0.6;
  }

  get available(): boolean {
    return this.active && !this.collected;
  }

  collect(): void {
    this.collected = true;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scale: this.scale * 1.8,
      alpha: 0,
      duration: 280,
      onComplete: () => this.destroy(),
    });
  }
}
