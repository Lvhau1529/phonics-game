/**
 * Cá thường (không mang chữ) của đàn cá kiểu Feeding Frenzy: bơi ngang qua màn theo bầy, nhấp nhô,
 * vẫy đuôi (khung bơi OceanFeast). Cá mà cá của bé ăn được thì sợ: tăng tốc, lảng ra khi bé tới gần.
 * Ra khỏi màn thì tự biến mất (SchoolDirector thả bầy mới).
 */
import Phaser from 'phaser';
import { DEPTH, SCHOOL } from '@/games/phonics-ocean/game/config/theme';
import type { SchoolSize } from '@/games/phonics-ocean/session/frenzy';

const FRAME_MS = 120;

export default class SchoolFish extends Phaser.GameObjects.Image {
  private frameIndex = Math.floor(Math.random() * 6);
  private frameTimer = Math.random() * FRAME_MS;
  private phase = Math.random() * Math.PI * 2;
  private baseY: number;
  private done = false;

  constructor(
    scene: Phaser.Scene,
    readonly size: SchoolSize,
    private readonly frames: readonly string[],
    x: number,
    y: number,
    private vx: number,
  ) {
    super(scene, x, y, frames[0]);
    this.baseY = y;
    this.setScale(SCHOOL[size].width / this.width)
      .setFlipX(vx < 0)
      .setDepth(DEPTH.SCHOOL + (size === 'big' ? 1 : 0));
    scene.add.existing(this);
  }

  get radius(): number {
    return this.displayWidth * 0.4;
  }

  get finished(): boolean {
    return this.done;
  }

  /**
   * @param threat cá của bé (nếu cá này ăn được thì né) hoặc null
   */
  override update(
    deltaMs: number,
    bounds: Phaser.Geom.Rectangle,
    speedScale: number,
    threat: { x: number; y: number } | null,
  ): void {
    if (this.done) return;
    const dt = deltaMs / 1000;
    let boost = 1;
    if (threat) {
      const dx = this.x - threat.x;
      const dy = this.y - threat.y;
      if (Math.hypot(dx, dy) < SCHOOL.fleeRadius) {
        boost = SCHOOL.fleeBoost;
        // Lảng lên / xuống khỏi miệng cá; quay đầu nếu đang bơi thẳng vào
        this.baseY += Math.sign(dy || 1) * 60 * dt;
        if (Math.sign(dx) !== Math.sign(this.vx) && Math.abs(dx) > 8) this.turn();
      }
    }
    this.baseY = Phaser.Math.Clamp(this.baseY, bounds.y + 12, bounds.bottom - 12);
    this.phase += dt * 3;
    this.x += this.vx * speedScale * boost * dt;
    this.y = this.baseY + Math.sin(this.phase) * 4;

    this.frameTimer += deltaMs * boost;
    if (this.frameTimer >= FRAME_MS && this.frames.length > 1) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.setTexture(this.frames[this.frameIndex]);
    }
    const half = this.displayWidth / 2;
    if (
      (this.vx > 0 && this.x > bounds.right + half + 20) ||
      (this.vx < 0 && this.x < bounds.x - half - 20)
    ) {
      this.vanish();
    }
  }

  /** Bị ăn (bởi cá của bé hoặc cá săn mồi): bay vào miệng rồi biến mất */
  eatenBy(mouth: { x: number; y: number }): void {
    if (this.done) return;
    this.done = true;
    this.scene.tweens.add({
      targets: this,
      x: mouth.x,
      y: mouth.y,
      scale: this.scale * 0.2,
      alpha: 0.3,
      duration: 140,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  private turn(): void {
    this.vx = -this.vx;
    this.setFlipX(this.vx < 0);
  }

  private vanish(): void {
    this.done = true;
    this.destroy();
  }
}
