/**
 * Cá săn mồi (cá mập, cá nóc, lươn, cá lồng đèn): tạo áp lực kiểu Feeding Frenzy, TÁCH khỏi lỗi phonics
 * (GAMEPLAY_PHONICS_V2 §3.7). Có cảnh báo "!" ở mép màn trước khi xuất hiện, bơi ngang qua, lượn nhẹ
 * theo bé ở nửa đầu quãng đường rồi bơi thẳng ra ngoài. Không bao giờ xuất hiện sát cá của bé.
 */
import Phaser from 'phaser';
import type { PredatorKind } from '@/games/phonics-ocean/content/schema';
import { PREDATOR_FRAMES } from '@/games/phonics-ocean/game/config/sprites';
import { DEPTH, FEEL, THEME } from '@/games/phonics-ocean/game/config/theme';
import { addText } from '@/games/phonics-ocean/game/ui/text';

const FRAME_MS = 160;

export default class Predator extends Phaser.GameObjects.Image {
  private readonly frames: readonly string[];
  private readonly direction: 1 | -1;
  private frameIndex = 0;
  private frameTimer = 0;
  private travelled = 0;
  private done = false;

  constructor(
    scene: Phaser.Scene,
    readonly kind: PredatorKind,
    y: number,
    direction: 1 | -1,
    private readonly bounds: Phaser.Geom.Rectangle,
    private readonly speed: number,
  ) {
    const frames = PREDATOR_FRAMES[kind] ?? PREDATOR_FRAMES.shark;
    super(scene, 0, y, frames[0]);
    this.frames = frames;
    this.direction = direction;
    this.setScale(FEEL.predatorHeight[kind] / this.height).setFlipX(direction < 0);
    this.setX(direction > 0 ? bounds.x - this.displayWidth / 2 : bounds.right + this.displayWidth / 2);
    this.setDepth(DEPTH.PREDATOR);
    scene.add.existing(this);
  }

  /** Hình elip va chạm xấp xỉ bằng vòng tròn ở thân */
  get hitRadius(): number {
    return this.displayHeight * 0.38;
  }

  /** Tâm vùng cắn: lệch về phía đầu */
  get hitCenter(): { x: number; y: number } {
    return { x: this.x + this.direction * this.displayWidth * 0.18, y: this.y };
  }

  get finished(): boolean {
    return this.done;
  }

  override update(deltaMs: number, playerY: number, calm: boolean): void {
    if (this.done) return;
    const dt = deltaMs / 1000;
    const speed = this.speed * (calm ? 0.65 : 1);
    this.x += this.direction * speed * dt;
    this.travelled += speed * dt;
    // Lượn theo bé ở 55% quãng đường đầu
    if (this.travelled < this.bounds.width * 0.55) {
      const dy = playerY - this.y;
      this.y += Phaser.Math.Clamp(dy, -FEEL.predatorHoming * dt, FEEL.predatorHoming * dt);
    }
    this.frameTimer += deltaMs;
    if (this.frameTimer >= FRAME_MS && this.frames.length > 1) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.setTexture(this.frames[this.frameIndex]);
    }
    const half = this.displayWidth / 2;
    if (this.x < this.bounds.x - half - 10 || this.x > this.bounds.right + half + 10) {
      this.done = true;
      this.destroy();
    }
  }
}

/** Cảnh báo "!" nhấp nháy ở mép màn nơi cá săn mồi sắp vào (telegraph) */
export function showWarning(scene: Phaser.Scene, x: number, y: number, durationMs: number): Promise<void> {
  const badge = scene.add.container(x, y).setDepth(DEPTH.BANNER);
  const g = scene.add.graphics();
  g.fillStyle(THEME.hex.ink).fillCircle(0, 0, 19);
  g.fillStyle(THEME.hex.red).fillCircle(0, 0, 16);
  const mark = addText(scene, 0, 1, '!', 'outline', { fontSize: '24px' });
  badge.add([g, mark]);
  return new Promise((resolve) => {
    scene.tweens.add({
      targets: badge,
      scale: { from: 0.8, to: 1.15 },
      alpha: { from: 1, to: 0.55 },
      duration: 220,
      yoyo: true,
      repeat: Math.max(0, Math.round(durationMs / 440) - 1),
      onComplete: () => {
        badge.destroy();
        resolve();
      },
    });
  });
}
