/**
 * Cá của bé: mỗi biome một loài (pack v3 — cá đỏ rạn san hô ... cá giáp núi lửa), 3 cỡ lớn dần.
 * Bơi về phía ngón tay / con trỏ (chạm giữ hoặc chạm một lần) hoặc theo phím mũi tên / WASD.
 * Hitbox là vòng tròn ở miệng, nhỏ hơn hình ~15% (GAMEPLAY_PHONICS_V2 §12) cho dễ chịu với trẻ.
 */
import Phaser from 'phaser';
import type { Biome } from '@/games/phonics-ocean/content/schema';
import { DEPTH, FEEL } from '@/games/phonics-ocean/game/config/theme';
import { PLAYER_FRAMES, playerFrame } from '@/games/phonics-ocean/game/config/sprites';
import { FX } from '@/games/phonics-ocean/game/systems/textures';

export interface SteerInput {
  /** Hướng từ bàn phím (-1..1), null nếu không bấm phím */
  keys: { x: number; y: number } | null;
  /** Điểm bé chạm / trỏ tới (toạ độ logic) */
  target: { x: number; y: number } | null;
}

export default class PlayerFish extends Phaser.GameObjects.Container {
  tier = 1;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shieldBubble: Phaser.GameObjects.Image;
  /** Quầng vàng khi FRENZY! */
  private readonly aura: Phaser.GameObjects.Image;
  /** Nam châm nhỏ lơ lửng trên đầu khi đang bật nam châm */
  private readonly magnet: Phaser.GameObjects.Image;
  private readonly velocity = new Phaser.Math.Vector2();
  private facing = 1;
  private frame = 0;
  private frameTimer = 0;
  private stunUntil = 0;
  private invulnerableUntil = 0;
  private shieldUntil = 0;
  private speedScale = 1;
  private bumpUntil = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly bounds: Phaser.Geom.Rectangle,
    private readonly biome: Biome,
  ) {
    super(scene, x, y);
    this.sprite = scene.add.image(0, 0, playerFrame(biome, 0));
    this.shieldBubble = scene.add.image(0, 0, FX.BUBBLE).setAlpha(0).setVisible(false);
    this.aura = scene.add.image(0, 0, FX.DOT).setTint(0xffd23f).setAlpha(0).setVisible(false);
    this.magnet = scene.add.image(0, 0, 'item.magnet').setVisible(false);
    this.add([this.aura, this.sprite, this.shieldBubble, this.magnet]);
    this.setDepth(DEPTH.PLAYER);
    this.applySize();
    scene.add.existing(this);
  }

  /** Chiều cao cá (px logic) theo cỡ */
  get size(): number {
    return FEEL.playerHeight[this.tier];
  }

  /** Miệng (điểm ăn) — phía trước đầu cá */
  get mouth(): { x: number; y: number; r: number } {
    const h = this.size;
    return { x: this.x + this.facing * h * 0.45, y: this.y + h * 0.05, r: h * 0.42 };
  }

  /** Thân (va chạm với cá săn mồi) */
  get hitRadius(): number {
    return this.size * 0.4;
  }

  get stunned(): boolean {
    return this.scene.time.now < this.stunUntil;
  }

  /**
   * Bé đang chủ động bơi về phía (x, y) — chỉ khi đó chạm cá sai mới tính là "ăn nhầm";
   * cá sai tự bơi vào cá đang đứng yên thì không phạt.
   */
  isChasing(x: number, y: number): boolean {
    const speed = this.velocity.length();
    if (speed < FEEL.chaseMinSpeed) return false;
    const dx = x - this.x;
    const dy = y - this.y;
    return (this.velocity.x * dx + this.velocity.y * dy) / (speed * Math.max(1, Math.hypot(dx, dy))) > 0.3;
  }

  get shielded(): boolean {
    return this.scene.time.now < this.shieldUntil;
  }

  get invulnerable(): boolean {
    return this.scene.time.now < this.invulnerableUntil;
  }

  setSpeedScale(scale: number): void {
    this.speedScale = scale;
  }

  /** Va vào cá to hơn mình (không mất tim): bật lùi nhẹ; trả về false nếu vừa va (đang hồi) */
  bump(fromX: number, fromY: number): boolean {
    const now = this.scene.time.now;
    if (now < this.bumpUntil) return false;
    this.bumpUntil = now + FEEL.bumpCooldownMs;
    const away = new Phaser.Math.Vector2(this.x - fromX, this.y - fromY).normalize();
    this.velocity.set(away.x * FEEL.bumpSpeed, away.y * FEEL.bumpSpeed);
    this.stunUntil = Math.max(this.stunUntil, now + 120);
    this.scene.tweens.add({
      targets: this,
      angle: { from: -10, to: 10 },
      duration: 90,
      yoyo: true,
      onComplete: () => this.setAngle(0),
    });
    return true;
  }

  /** FRENZY!: quầng vàng nhấp nháy quanh cá */
  setFrenzy(on: boolean): void {
    if (on === this.aura.visible) return;
    this.scene.tweens.killTweensOf(this.aura);
    this.aura.setVisible(on).setAlpha(on ? 0.45 : 0);
    if (on) this.scene.tweens.add({ targets: this.aura, alpha: 0.15, duration: 260, yoyo: true, repeat: -1 });
  }

  /** Nam châm: hiện trên đầu; còn dưới 1,5 giây thì nhấp nháy báo sắp hết */
  setMagnet(remainingMs: number): void {
    const on = remainingMs > 0;
    if (!on) {
      if (this.magnet.visible) this.scene.tweens.killTweensOf(this.magnet);
      this.magnet.setVisible(false);
      return;
    }
    if (!this.magnet.visible) {
      this.magnet.setVisible(true).setAlpha(1);
      this.scene.tweens.add({
        targets: this.magnet,
        angle: { from: -12, to: 12 },
        duration: 360,
        yoyo: true,
        repeat: -1,
      });
    }
    this.magnet.setAlpha(remainingMs < 1500 && Math.floor(remainingMs / 150) % 2 === 0 ? 0.35 : 1);
  }

  /** Lớn thêm một cỡ: phồng lên rồi về kích thước mới */
  grow(tier: number): void {
    this.tier = Phaser.Math.Clamp(tier, 1, 3);
    this.frame = 0;
    this.applySize();
    this.scene.tweens.add({
      targets: this,
      scale: { from: 0.7, to: 1 },
      duration: 420,
      ease: 'Back.easeOut',
    });
  }

  /** Đớp mồi: phồng nhanh (pack v3 không có khung há miệng) */
  bite(): void {
    this.scene.tweens.add({ targets: this, scale: 1.12, duration: 110, yoyo: true });
  }

  /** Ăn nhầm: choáng nhẹ, lắc lư (không mất tim) */
  stun(): void {
    this.stunUntil = this.scene.time.now + FEEL.stunMs;
    this.velocity.scale(0.2);
    this.scene.tweens.add({
      targets: this,
      angle: { from: -14, to: 14 },
      duration: 110,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.setAngle(0),
    });
    for (let i = 0; i < 3; i += 1) {
      const star = this.scene.add
        .image(this.x, this.y - this.size * 0.6, FX.SPARK)
        .setDisplaySize(10, 10)
        .setDepth(DEPTH.FX);
      this.scene.tweens.add({
        targets: star,
        x: this.x + Math.cos((i / 3) * Math.PI * 2) * 18,
        y: this.y - this.size * 0.6 + Math.sin((i / 3) * Math.PI * 2) * 6,
        alpha: 0,
        duration: FEEL.stunMs,
        onComplete: () => star.destroy(),
      });
    }
  }

  /** Bị cá săn mồi cắn: bật lùi, nhấp nháy, miễn nhiễm một lúc */
  hurt(fromX: number): void {
    this.invulnerableUntil = this.scene.time.now + FEEL.hurtInvulnerableMs;
    this.stunUntil = this.scene.time.now + 350;
    const away = this.x >= fromX ? 1 : -1;
    this.velocity.set(away * 260, -60);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.25,
      duration: 120,
      yoyo: true,
      repeat: Math.floor(FEEL.hurtInvulnerableMs / 240) - 1,
      onComplete: () => this.sprite.setAlpha(1),
    });
  }

  /** Bong bóng bảo vệ: đỡ một lần cắn */
  setShield(on: boolean): void {
    this.shieldUntil = on ? this.scene.time.now + FEEL.shieldMs : 0;
    this.shieldBubble.setVisible(on);
    this.scene.tweens.killTweensOf(this.shieldBubble);
    if (on) {
      this.shieldBubble.setAlpha(0.85);
      this.scene.tweens.add({
        targets: this.shieldBubble,
        alpha: 0.45,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  steer(input: SteerInput, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const now = this.scene.time.now;
    if (this.shieldBubble.visible && !this.shielded) this.setShield(false);

    const desired = new Phaser.Math.Vector2();
    if (now >= this.stunUntil) {
      if (input.keys && (input.keys.x !== 0 || input.keys.y !== 0)) {
        desired.set(input.keys.x, input.keys.y).normalize();
      } else if (input.target) {
        const dx = input.target.x - this.x;
        const dy = input.target.y - this.y;
        const distance = Math.hypot(dx, dy);
        // Chậm dần khi tới gần điểm chạm để không lắc qua lắc lại
        if (distance > 4)
          desired
            .set(dx, dy)
            .normalize()
            .scale(Math.min(1, distance / 40));
      }
    }
    const speed = FEEL.playerSpeed * this.speedScale;
    const blend = Math.min(1, FEEL.playerTurn * dt);
    this.velocity.x += (desired.x * speed - this.velocity.x) * blend;
    this.velocity.y += (desired.y * speed - this.velocity.y) * blend;

    const h = this.size;
    this.x = Phaser.Math.Clamp(
      this.x + this.velocity.x * dt,
      this.bounds.x + h * 0.6,
      this.bounds.right - h * 0.6,
    );
    this.y = Phaser.Math.Clamp(
      this.y + this.velocity.y * dt,
      this.bounds.y + h * 0.5,
      this.bounds.bottom - h * 0.5,
    );

    if (Math.abs(this.velocity.x) > 12) this.facing = this.velocity.x > 0 ? 1 : -1;
    // Nghiêng nhẹ theo hướng bơi lên / xuống
    this.sprite.setRotation(Phaser.Math.Clamp((this.velocity.y / speed) * 0.35, -0.35, 0.35) * this.facing);
    this.animate(deltaMs);
  }

  private animate(deltaMs: number): void {
    const moving = this.velocity.length() > 20;
    this.frameTimer += deltaMs * (moving ? 1 : 0.5);
    if (this.frameTimer >= FEEL.swimFrameMs) {
      this.frameTimer = 0;
      this.frame = (this.frame + 1) % PLAYER_FRAMES;
    }
    this.sprite.setTexture(playerFrame(this.biome, this.frame));
    this.applySize();
  }

  private applySize(): void {
    const h = this.size;
    const scale = h / this.sprite.height;
    this.sprite.setScale(scale * this.facing, scale);
    this.shieldBubble.setDisplaySize(h * 1.9, h * 1.9);
    this.aura.setDisplaySize(h * 2.1, h * 1.7);
    this.magnet.setScale(22 / Math.max(this.magnet.width, this.magnet.height)).setPosition(0, -h * 0.75);
  }
}
