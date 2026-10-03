/**
 * Hiệu ứng "game feel": sparkle, pháo sao, pháo hoa / confetti, khói, vụn bánh, popup chữ, rung camera.
 * Phản hồi sai luôn nhẹ nhàng — không chớp mạnh, không rung dữ (plan §13, §34).
 * Ảnh FX của Kids Bakery pack (`fx/*`) vẽ ở 2x -> scale hiển thị nhân FX_IMAGE_SCALE.
 */
import Phaser from 'phaser';
import { DEPTH, THEME, TIMING } from '@/games/bread-catcher/game/config/gameConfig';
import { view } from '@/platform/phaser/view';
import { addText } from '@/games/bread-catcher/game/ui/text';

const FX_IMAGE_SCALE = 0.5;

/** Ảnh FX nở từ `from` -> `to` (scale logic) rồi mờ dần */
interface PopOptions {
  from: number;
  to: number;
  duration: number;
  angle?: number;
  tint?: number;
}

export default class EffectsSystem {
  private readonly sparkles: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly stars: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly puffs: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(private readonly scene: Phaser.Scene) {
    this.sparkles = scene.add
      .particles(0, 0, 'sparkle', {
        speed: { min: 60, max: 170 },
        angle: { min: 200, max: 340 },
        scale: { start: 0.9, end: 0 },
        rotate: { min: 0, max: 180 },
        gravityY: 260,
        lifespan: 450,
        emitting: false,
      })
      .setDepth(DEPTH.FX);

    this.stars = scene.add
      .particles(0, 0, 'star', {
        speed: { min: 120, max: 260 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.55, end: 0 },
        rotate: { min: -180, max: 180 },
        gravityY: 300,
        lifespan: 800,
        emitting: false,
      })
      .setDepth(DEPTH.FX);

    this.puffs = scene.add
      .particles(0, 0, 'sparkle', {
        speed: { min: 20, max: 70 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.3, end: 0.2 },
        alpha: { start: 0.8, end: 0 },
        tint: [0x9a8f88, 0xc9b8b0, 0xff8a8a],
        lifespan: 550,
        emitting: false,
      })
      .setDepth(DEPTH.FX);
  }

  /** Sparkle nhỏ + chớp sáng tại điểm hứng đúng */
  catchBurst(x: number, y: number): void {
    this.sparkles.explode(8, x, y);
    const flash = this.scene.add.image(x, y, 'catch_flash').setDepth(DEPTH.FX).setScale(0.3).setAlpha(0.9);
    this.scene.tweens.add({
      targets: flash,
      scale: 0.8,
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  /** Pháo hoa + confetti + pháo sao khi hoàn thành cả từ */
  wordBurst(x: number, y: number): void {
    this.pop('fireworks', x, y - 20, { from: 0.3, to: 1.3, duration: 800 });
    this.pop('confetti', x, y - 10, {
      from: 0.5,
      to: 1.3,
      duration: 700,
      angle: Phaser.Math.Between(-12, 12),
    });
    this.stars.explode(14, x, y);
    this.sparkles.explode(20, x, y);
  }

  /** Cụm khói xám nhạt + bụi nhỏ khi hứng nhầm (plan §13) */
  wrongPuff(x: number, y: number): void {
    this.pop('puff', x, y, { from: 0.4, to: 0.9, duration: 500, tint: 0xd9cec8 });
    this.puffs.explode(8, x, y);
  }

  /** Vụ nổ: chớp cam lớn + tia lửa + rung (bom — level HARD) */
  explosion(x: number, y: number): void {
    const flash = this.scene.add
      .image(x, y, 'catch_flash')
      .setDepth(DEPTH.FX)
      .setTint(0xff7a2a)
      .setScale(0.5);
    this.scene.tweens.add({
      targets: flash,
      scale: 1.8,
      alpha: 0,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
    this.pop('crumbs', x, y, { from: 0.5, to: 1.4, duration: 450, angle: Phaser.Math.Between(-30, 30) });
    this.sparkles.explode(18, x, y);
    this.scene.cameras.main.shake(220, 0.012);
  }

  private pop(key: string, x: number, y: number, { from, to, duration, angle = 0, tint }: PopOptions): void {
    if (!this.scene.textures.exists(key)) return;
    const image = this.scene.add
      .image(x, y, key)
      .setDepth(DEPTH.FX)
      .setScale(from * FX_IMAGE_SCALE)
      .setAngle(angle);
    if (tint !== undefined) image.setTint(tint);
    this.scene.tweens.add({
      targets: image,
      scale: to * FX_IMAGE_SCALE,
      alpha: { from: 1, to: 0, ease: 'Quad.easeIn' },
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => image.destroy(),
    });
  }

  /** Chữ bay lên ~24px rồi mờ dần */
  popup(x: number, y: number, text: string, color: string = THEME.colors.gold): void {
    const label = addText(this.scene, x, y, text, 'popup', { color }).setDepth(DEPTH.FX);
    this.scene.tweens.add({
      targets: label,
      y: y - 24,
      alpha: { from: 1, to: 0 },
      scale: { from: 1.2, to: 1 },
      duration: TIMING.popup,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  /** Chữ lớn giữa màn hình, nảy vào rồi mờ đi (lời khen, thông báo prank...) */
  announce(text: string, color: string = THEME.colors.pink, { holdMs = 700, size = 32 } = {}): void {
    const { width, height } = view(this.scene);
    const label = addText(this.scene, width / 2, height * 0.5, text, 'outline', {
      fontSize: `${size}px`,
      fontStyle: '800',
      color,
      strokeThickness: 7,
      wordWrap: { width: width - 30 },
    }).setDepth(DEPTH.BANNER);
    this.scene.tweens.chain({
      targets: label,
      tweens: [
        { scale: { from: 0, to: 1 }, angle: { from: -10, to: 0 }, duration: 260, ease: 'Back.easeOut' },
        { alpha: 0, y: label.y - 30, delay: holdMs, duration: 250, ease: 'Quad.easeIn' },
      ],
      onComplete: () => label.destroy(),
    });
  }

  shake(strength: 'light' | 'strong' = 'strong'): void {
    const intensity = strength === 'strong' ? 0.004 : 0.0025;
    this.scene.cameras.main.shake(100, intensity);
  }
}
