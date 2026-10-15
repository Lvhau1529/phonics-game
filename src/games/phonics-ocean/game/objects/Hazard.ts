/**
 * Chướng ngại vùng nước sâu (session/sea.ts — chỉ từ twilight_trench). Chậm, dễ thấy, dễ né; chạm vào chỉ
 * choáng nhẹ (không mất tim, không nổ, không đáng sợ):
 *   jelly — sứa trôi lên từ đáy, đung đưa       mine — thuỷ lôi trôi ngang, chạm thì "POP" thành bong bóng
 *   crab  — cua bò ngang dọc đáy                rock — đá rơi chậm (hạt vụn lắc rắc báo trước ở mép trên)
 * Luôn xuất hiện xa cá của bé (`avoidX`).
 */
import Phaser from 'phaser';
import { HAZARD_FRAMES } from '@/games/phonics-ocean/game/config/sprites';
import { DEPTH, HAZARD_LOOK } from '@/games/phonics-ocean/game/config/theme';
import { FX } from '@/games/phonics-ocean/game/systems/textures';
import type { HazardKind } from '@/games/phonics-ocean/session/sea';
import { pickRandom } from '@/core/utils/random';

/** Khoảng cách ngang tối thiểu tới cá của bé lúc xuất hiện (px logic) */
const AVOID = 130;

export default class Hazard extends Phaser.GameObjects.Image {
  private readonly frames: readonly string[];
  private readonly direction: 1 | -1;
  private baseX = 0;
  private baseY = 0;
  private frameIndex = 0;
  private frameTimer = 0;
  private phase = Math.random() * Math.PI * 2;
  /** Đá rơi: chưa rơi (đang báo trước) thì chưa va chạm được */
  private ready = true;
  private done = false;

  constructor(
    scene: Phaser.Scene,
    readonly kind: HazardKind,
    private readonly bounds: Phaser.Geom.Rectangle,
    avoidX: number,
  ) {
    const frames = HAZARD_FRAMES[kind];
    // Đá: mỗi hòn một hình (không phải khung chuyển động)
    const texture = kind === 'rock' ? pickRandom(frames) : frames[0];
    super(scene, 0, 0, texture);
    this.frames = kind === 'rock' ? [texture] : frames;
    const look = HAZARD_LOOK[kind];
    this.setScale(look.size / Math.max(this.width, this.height)).setDepth(DEPTH.HAZARD);
    // Trôi ngang thì vào từ mép xa cá của bé
    this.direction = avoidX > bounds.centerX ? 1 : -1;
    const half = this.displayWidth / 2;
    const sideX = this.direction > 0 ? bounds.x - half : bounds.right + half;

    switch (kind) {
      case 'jelly':
        this.baseX = awayFrom(avoidX, bounds);
        this.baseY = bounds.bottom + this.displayHeight / 2;
        break;
      case 'mine':
        this.baseX = sideX;
        this.baseY = Phaser.Math.Between(bounds.y + 50, bounds.bottom - 60);
        break;
      case 'crab':
        this.baseX = sideX;
        this.baseY = bounds.bottom - this.displayHeight / 2 - 2;
        break;
      case 'rock':
        this.baseX = awayFrom(avoidX, bounds);
        this.baseY = bounds.y - this.displayHeight / 2;
        this.warn();
        break;
    }
    this.setPosition(this.baseX, this.baseY);
    scene.add.existing(this);
  }

  /** Vùng chạm: vòng tròn nhỏ hơn hình (dễ chịu với trẻ); sứa lệch lên phần chuông */
  get hitCenter(): { x: number; y: number } {
    return this.kind === 'jelly'
      ? { x: this.x, y: this.y - this.displayHeight * 0.18 }
      : { x: this.x, y: this.y };
  }

  get hitRadius(): number {
    return Math.min(this.displayWidth, this.displayHeight) * 0.38;
  }

  get armed(): boolean {
    return this.ready && !this.done;
  }

  get finished(): boolean {
    return this.done;
  }

  override update(deltaMs: number): void {
    if (this.done || !this.ready) return;
    const dt = deltaMs / 1000;
    const { speed } = HAZARD_LOOK[this.kind];
    const { bounds } = this;
    this.phase += dt * 2;
    switch (this.kind) {
      case 'jelly':
        this.y -= speed * dt;
        this.x = this.baseX + Math.sin(this.phase) * 14;
        // Co giãn nhẹ như đang bơi
        this.setScale(this.scaleX, this.scaleX * (1 + Math.sin(this.phase * 2) * 0.05));
        if (this.y < bounds.y - this.displayHeight) this.finish();
        break;
      case 'mine':
        this.x += this.direction * speed * dt;
        this.y = this.baseY + Math.sin(this.phase) * 8;
        this.setAngle(Math.sin(this.phase * 0.5) * 10);
        if (this.offSide()) this.finish();
        break;
      case 'crab':
        this.x += this.direction * speed * dt;
        if (this.offSide()) this.finish();
        break;
      case 'rock':
        this.y += speed * dt;
        this.angle += 40 * dt;
        if (this.y > bounds.bottom - this.displayHeight / 2) this.settle();
        break;
    }
    this.animate(deltaMs);
  }

  /** Chạm phải: thuỷ lôi "POP" thành bong bóng, đá vỡ vụn; sứa / cua vẫn đi tiếp */
  hit(): void {
    if (this.kind !== 'mine' && this.kind !== 'rock') return;
    this.burst(this.kind === 'mine' ? 10 : 6);
    this.finish();
  }

  private animate(deltaMs: number): void {
    const { frameMs } = HAZARD_LOOK[this.kind];
    if (frameMs === 0 || this.frames.length < 2) return;
    this.frameTimer += deltaMs;
    if (this.frameTimer < frameMs) return;
    this.frameTimer = 0;
    this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    this.setTexture(this.frames[this.frameIndex]);
  }

  private offSide(): boolean {
    const half = this.displayWidth / 2;
    return this.direction > 0 ? this.x > this.bounds.right + half : this.x < this.bounds.x - half;
  }

  /** Đá rơi: hạt vụn lắc rắc ở mép trên trước khi đá rơi */
  private warn(): void {
    this.ready = false;
    this.setVisible(false);
    const top = this.bounds.y + 4;
    const timer = this.scene.time.addEvent({
      delay: 110,
      repeat: Math.round(HAZARD_LOOK.rockWarnMs / 110) - 1,
      callback: () => {
        const dust = this.scene.add
          .image(this.baseX + Phaser.Math.Between(-12, 12), top, FX.DOT)
          .setTint(0x9b8b78)
          .setDisplaySize(5, 5)
          .setDepth(DEPTH.HAZARD);
        this.scene.tweens.add({
          targets: dust,
          y: top + Phaser.Math.Between(26, 46),
          alpha: 0,
          duration: 600,
          onComplete: () => dust.destroy(),
        });
      },
    });
    this.scene.time.delayedCall(HAZARD_LOOK.rockWarnMs, () => {
      if (!this.active) return;
      timer.remove();
      this.ready = true;
      this.setVisible(true);
    });
  }

  /** Đá chạm đáy: nằm lại một chút rồi mờ đi */
  private settle(): void {
    this.ready = false;
    this.done = true;
    this.burst(4);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      delay: 400,
      duration: 500,
      onComplete: () => this.destroy(),
    });
  }

  private burst(count: number): void {
    for (let i = 0; i < count; i += 1) {
      const size = Phaser.Math.Between(6, 12);
      const bubble = this.scene.add
        .image(this.x, this.y, FX.BUBBLE)
        .setDisplaySize(size, size)
        .setDepth(DEPTH.FX);
      this.scene.tweens.add({
        targets: bubble,
        x: this.x + Phaser.Math.Between(-28, 28),
        y: this.y - Phaser.Math.Between(16, 56),
        alpha: 0,
        duration: Phaser.Math.Between(450, 800),
        ease: 'Sine.easeOut',
        onComplete: () => bubble.destroy(),
      });
    }
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.scene.tweens.killTweensOf(this);
    this.destroy();
  }
}

/** Cột x ngẫu nhiên trong vùng bơi, cách cá của bé ít nhất AVOID */
function awayFrom(avoidX: number, bounds: Phaser.Geom.Rectangle): number {
  const left = bounds.x + 40;
  const right = bounds.right - 40;
  for (let i = 0; i < 8; i += 1) {
    const x = Phaser.Math.Between(left, right);
    if (Math.abs(x - avoidX) >= AVOID) return x;
  }
  return avoidX > bounds.centerX ? left : right;
}
