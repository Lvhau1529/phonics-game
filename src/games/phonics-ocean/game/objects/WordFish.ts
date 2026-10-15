/**
 * Cá mồi mang một từ (word-fish). Sprite pack v3 có sẵn nhãn kem trống giữa thân; chữ vẽ live trên một nhãn
 * cùng màu đặt đúng chỗ đó (nới rộng theo độ dài từ) — sprite chỉ là "vật mang" dùng lại cho mọi danh sách từ.
 * Bơi ngang, nhấp nhô nhẹ, chạm mép vùng chơi thì quay đầu.
 */
import Phaser from 'phaser';
import { DEPTH, FEEL, THEME } from '@/games/phonics-ocean/game/config/theme';
import { addText } from '@/games/phonics-ocean/game/ui/text';
import { FX } from '@/games/phonics-ocean/game/systems/textures';

type FishState = 'enter' | 'swim' | 'leave' | 'gone';

const LABEL_HEIGHT = 24;
/** Tâm nhãn trống trên sprite: lệch xuống dưới tâm ảnh (tỉ lệ chiều cao) — đo trên 25 cá của pack v3 */
const PLATE_Y = 0.065;
/** Bề rộng nhãn trống (tỉ lệ bề rộng cá) — nhãn chữ không hẹp hơn */
const PLATE_W = 0.42;

export default class WordFish extends Phaser.GameObjects.Container {
  private readonly fish: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Image;
  private fishState: FishState = 'enter';
  private vx: number;
  private baseY: number;
  private phase = Math.random() * Math.PI * 2;
  private cooldownUntil = 0;
  /** Nửa bề rộng lớn nhất (thân cá hoặc nhãn chữ) — quay đầu trước khi nhãn chạm mép màn */
  private readonly halfWidth: number;

  constructor(
    scene: Phaser.Scene,
    readonly word: string,
    readonly correct: boolean,
    texture: string,
    { x, y, speed }: { x: number; y: number; speed: number },
  ) {
    super(scene, x, y);
    this.baseY = y;
    this.vx = speed;

    this.glow = scene.add.image(0, 0, FX.DOT).setTint(THEME.hex.gold).setAlpha(0).setVisible(false);
    this.glow.setDisplaySize(FEEL.preyWidth * 1.8, FEEL.preyWidth * 1.4);

    this.fish = scene.add.image(0, 0, texture);
    this.fish.setScale(FEEL.preyWidth / this.fish.width);

    const centerY = this.fish.displayHeight * PLATE_Y;
    const text = addText(scene, 0, centerY, word, 'learning', { fontSize: '18px' });
    const width = Math.max(FEEL.preyWidth * PLATE_W, text.width + 14);
    this.halfWidth = Math.max(FEEL.preyWidth, width) / 2;
    const label = scene.add.graphics();
    const top = centerY - LABEL_HEIGHT / 2;
    label.fillStyle(THEME.hex.ink).fillRoundedRect(-width / 2 - 2, top - 2, width + 4, LABEL_HEIGHT + 4, 12);
    label.fillStyle(THEME.hex.cream).fillRoundedRect(-width / 2, top, width, LABEL_HEIGHT, 10);

    this.add([this.glow, this.fish, label, text]);
    this.setDepth(DEPTH.PREY);
    this.face();
    scene.add.existing(this);
  }

  /** Bán kính va chạm (thân + nhãn) */
  get radius(): number {
    return FEEL.preyWidth * 0.4;
  }

  get catchable(): boolean {
    return this.fishState === 'swim' && this.scene.time.now >= this.cooldownUntil;
  }

  get gone(): boolean {
    return this.fishState === 'gone';
  }

  override update(deltaMs: number, bounds: Phaser.Geom.Rectangle, speedScale: number): void {
    if (this.fishState === 'gone') return;
    const dt = deltaMs / 1000;
    this.phase += dt * 2.2;
    // Đang vào màn / rời màn thì bơi nhanh để đề mới tới sớm, đề cũ đi gọn
    const rush = this.fishState === 'enter' ? 3 : this.fishState === 'leave' ? 3 : 1;
    this.x += this.vx * speedScale * dt * rush;
    this.y = this.baseY + Math.sin(this.phase) * 6;

    const margin = this.halfWidth + 4;
    if (this.fishState === 'enter') {
      if (this.x > bounds.x + margin && this.x < bounds.right - margin) this.fishState = 'swim';
      return;
    }
    if (this.fishState === 'leave') {
      if (this.x < bounds.x - 80 || this.x > bounds.right + 80) this.vanish();
      return;
    }
    if ((this.x < bounds.x + margin && this.vx < 0) || (this.x > bounds.right - margin && this.vx > 0)) {
      this.vx = -this.vx;
      this.face();
    }
  }

  /** Gợi ý: cá đúng toả sáng vàng */
  setHint(on: boolean): void {
    this.scene.tweens.killTweensOf(this.glow);
    this.glow.setVisible(on).setAlpha(on ? 0.55 : 0);
    if (on) this.scene.tweens.add({ targets: this.glow, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
  }

  /** Bị ăn nhầm: lắc, bị đẩy ra xa và tạm thời không ăn được */
  reject(fromX: number): void {
    this.cooldownUntil = this.scene.time.now + FEEL.rejectCooldownMs;
    const away = this.x >= fromX ? 1 : -1;
    this.vx = Math.abs(this.vx) * away;
    this.face();
    this.fish.setTint(0xff9a9a);
    this.scene.tweens.add({
      targets: this,
      x: this.x + away * 34,
      duration: 260,
      ease: 'Cubic.easeOut',
    });
    this.scene.tweens.add({
      targets: this.fish,
      angle: { from: -12, to: 12 },
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.fish.setAngle(0);
        this.fish.clearTint();
      },
    });
  }

  /** Tự bơi vào cá của bé đang đứng yên: quay đầu bơi đi (không phải lỗi của bé) */
  swerve(fromX: number): void {
    this.cooldownUntil = this.scene.time.now + FEEL.rejectCooldownMs;
    const away = this.x >= fromX ? 1 : -1;
    if (Math.sign(this.vx) === away) return;
    this.vx = Math.abs(this.vx) * away;
    this.face();
  }

  /** Bị ăn: thu nhỏ bay vào miệng cá của bé */
  eatenBy(mouth: { x: number; y: number }): Promise<void> {
    this.fishState = 'gone';
    this.setHint(false);
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        x: mouth.x,
        y: mouth.y,
        scale: 0.1,
        alpha: 0.4,
        duration: 180,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.destroy();
          resolve();
        },
      });
    });
  }

  /** Hết đề: bơi nhanh ra khỏi màn rồi biến mất */
  leave(): void {
    if (this.fishState === 'gone') return;
    this.fishState = 'leave';
    this.setHint(false);
    // Mờ hẳn trước khi đề mới tới (tránh hai cá cùng chữ trên màn)
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 500, onComplete: () => this.vanish() });
  }

  private vanish(): void {
    if (this.fishState === 'gone') return;
    this.fishState = 'gone';
    this.scene.tweens.killTweensOf([this, this.fish, this.glow]);
    this.destroy();
  }

  /** Sprite cá nhìn sang phải: lật theo hướng bơi (nhãn chữ không lật) */
  private face(): void {
    this.fish.setFlipX(this.vx < 0);
  }
}
