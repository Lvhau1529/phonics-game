/**
 * Bạn đồng hành (GAMEPLAY_PHONICS_V3 §9) — CHỈ TRANG TRÍ, không va chạm, không ảnh hưởng điểm:
 *   - rùa: bơi rất chậm ngang qua nửa dưới, nhấp nhô nhẹ (đại dương thân thiện)
 *   - cá heo: lướt nhanh theo đường vòng cung ở nửa trên, kéo vệt bong bóng — ăn mừng khi bé giỏi
 * Sprite pack nhìn sang phải: lật theo hướng bơi.
 */
import Phaser from 'phaser';
import { HELPER_FRAMES } from '@/games/phonics-ocean/game/config/sprites';
import { DEPTH, HELPER } from '@/games/phonics-ocean/game/config/theme';
import { FX } from '@/games/phonics-ocean/game/systems/textures';

export type CompanionKind = 'turtle' | 'dolphin';

export default class Companion extends Phaser.GameObjects.Image {
  private readonly frames: readonly string[];
  private readonly direction: 1 | -1;
  private readonly speed: number;
  private readonly baseY: number;
  private readonly startX: number;
  private readonly span: number;
  private frameIndex = 0;
  private frameTimer = 0;
  private bubbleTimer = 0;
  private phase = Math.random() * Math.PI * 2;
  private done = false;

  constructor(
    scene: Phaser.Scene,
    readonly kind: CompanionKind,
    private readonly bounds: Phaser.Geom.Rectangle,
  ) {
    const frames = HELPER_FRAMES[kind];
    super(scene, 0, 0, frames[0]);
    const look = HELPER[kind];
    this.frames = frames;
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.speed = Phaser.Math.Between(look.speed[0], look.speed[1]);
    this.setScale(look.height / this.height)
      .setFlipX(this.direction < 0)
      .setAlpha(look.alpha)
      .setDepth(DEPTH.HELPER);
    const half = this.displayWidth / 2;
    this.startX = this.direction > 0 ? bounds.x - half : bounds.right + half;
    this.span = bounds.width + half * 2;
    // Rùa ở nửa dưới, cá heo vòng cung ở nửa trên
    this.baseY =
      kind === 'turtle'
        ? Phaser.Math.Between(bounds.y + bounds.height * 0.55, bounds.bottom - 30)
        : bounds.y + bounds.height * Phaser.Math.FloatBetween(0.3, 0.45);
    this.setPosition(this.startX, this.baseY);
    scene.add.existing(this);
  }

  get finished(): boolean {
    return this.done;
  }

  override update(deltaMs: number): void {
    if (this.done) return;
    const dt = deltaMs / 1000;
    this.x += this.direction * this.speed * dt;
    const progress = Phaser.Math.Clamp(((this.x - this.startX) * this.direction) / this.span, 0, 1);
    if (this.kind === 'turtle') {
      this.phase += dt * 1.4;
      this.y = this.baseY + Math.sin(this.phase) * 5;
    } else {
      // Vòng cung: lên cao giữa màn, đầu chúc theo đường bay
      const lift = this.bounds.height * 0.2;
      this.y = this.baseY - Math.sin(progress * Math.PI) * lift;
      this.setRotation(-Math.cos(progress * Math.PI) * 0.35 * this.direction);
      this.trail(deltaMs);
    }
    this.animate(deltaMs);
    if (progress >= 1) {
      this.done = true;
      this.destroy();
    }
  }

  private animate(deltaMs: number): void {
    if (this.frames.length < 2) return;
    this.frameTimer += deltaMs;
    if (this.frameTimer < HELPER[this.kind].frameMs) return;
    this.frameTimer = 0;
    this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    this.setTexture(this.frames[this.frameIndex]);
  }

  /** Vệt bong bóng sau đuôi cá heo */
  private trail(deltaMs: number): void {
    this.bubbleTimer += deltaMs;
    if (this.bubbleTimer < 70) return;
    this.bubbleTimer = 0;
    const size = Phaser.Math.Between(5, 10);
    const bubble = this.scene.add
      .image(this.x - this.direction * this.displayWidth * 0.4, this.y, FX.BUBBLE)
      .setDisplaySize(size, size)
      .setDepth(DEPTH.HELPER);
    this.scene.tweens.add({
      targets: bubble,
      y: bubble.y - Phaser.Math.Between(14, 30),
      alpha: 0,
      duration: 700,
      onComplete: () => bubble.destroy(),
    });
  }
}
