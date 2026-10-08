/**
 * HUD (GAMEPLAY_PHONICS_V2 §8): nút tạm dừng, tim (chỉ mất khi bị cá săn mồi cắn), điểm, đồng hồ,
 * thanh Growth (tiến độ lớn lên) kèm hình cá theo cỡ hiện tại. Mục tiêu + loa ở TargetPanel.
 */
import Phaser from 'phaser';
import { playerFrame } from '@/games/phonics-ocean/game/config/sprites';
import { DEPTH, THEME } from '@/games/phonics-ocean/game/config/theme';
import type { OceanLayout } from '@/games/phonics-ocean/game/ui/layout';
import { addText } from '@/games/phonics-ocean/game/ui/text';
import { formatTime } from '@/shared/format';

const PILL_H = 28;
const HEART = 18;

export default class Hud {
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly growthFill: Phaser.GameObjects.Graphics;
  private readonly growthFish: Phaser.GameObjects.Image;
  private readonly growthWidth: number;
  private shownScore = 0;
  private scoreTween: Phaser.Tweens.Tween | null = null;
  private growth = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    layout: OceanLayout,
    { maxHearts, showHearts, onPause }: { maxHearts: number; showHearts: boolean; onPause: () => void },
  ) {
    const y = layout.topY;

    // Nút tạm dừng (to, dễ chạm)
    const pause = scene.add.container(26, y).setDepth(DEPTH.HUD);
    const circle = scene.add.graphics();
    circle.fillStyle(THEME.hex.ink).fillCircle(0, 0, 19);
    circle.fillStyle(THEME.hex.wood).fillCircle(0, 0, 16);
    circle.fillStyle(THEME.hex.cream).fillRoundedRect(-6, -7, 4, 14, 1).fillRoundedRect(2, -7, 4, 14, 1);
    pause.add(circle).setSize(44, 44).setInteractive({ useHandCursor: true });
    pause.on(Phaser.Input.Events.POINTER_DOWN, onPause);

    if (showHearts) {
      for (let i = 0; i < maxHearts; i += 1) {
        const heart = scene.add.image(58 + i * (HEART + 3), y, 'item.heart').setDepth(DEPTH.HUD);
        heart.setScale(HEART / heart.height);
        this.hearts.push(heart);
      }
    }

    // Giờ (phải) + điểm (bên trái giờ)
    const right = layout.width - 8;
    this.pill(right - 76, y, 76);
    const clock = scene.add.image(right - 62, y, 'item.clock').setDepth(DEPTH.HUD);
    clock.setScale(18 / clock.height);
    this.timerText = addText(scene, right - 30, y, '00:00', 'outline', { fontSize: '15px' }).setDepth(
      DEPTH.HUD,
    );

    this.pill(right - 168, y, 86);
    const star = scene.add.image(right - 154, y, 'item.star').setDepth(DEPTH.HUD);
    star.setScale(18 / star.height);
    this.scoreText = addText(scene, right - 117, y, '0', 'outline', { fontSize: '15px' }).setDepth(DEPTH.HUD);

    // Thanh Growth
    const { growth } = layout;
    this.growthWidth = growth.width;
    const bar = scene.add.graphics().setDepth(DEPTH.HUD);
    const left = growth.x - growth.width / 2;
    bar.fillStyle(THEME.hex.ink).fillRoundedRect(left - 3, growth.y - 9, growth.width + 6, 18, 9);
    bar.fillStyle(THEME.hex.woodDark).fillRoundedRect(left, growth.y - 6, growth.width, 12, 6);
    this.growthFill = scene.add.graphics({ x: left, y: growth.y }).setDepth(DEPTH.HUD);
    this.growthFish = scene.add.image(left - 6, growth.y, playerFrame(1, 0)).setDepth(DEPTH.HUD + 1);
    this.setGrowth(0, 1, false);
  }

  setHearts(count: number): void {
    this.hearts.forEach((heart, index) => {
      const full = index < count;
      if (full === heart.alpha > 0.5) return;
      heart.setAlpha(full ? 1 : 0.25);
      this.scene.tweens.add({ targets: heart, scale: heart.scale * 1.5, duration: 140, yoyo: true });
    });
  }

  setTime(remainingMs: number): void {
    this.timerText
      .setText(formatTime(remainingMs))
      .setColor(remainingMs <= 10_000 ? THEME.colors.red : THEME.colors.white);
  }

  /** Điểm chạy lên dần */
  setScore(value: number): void {
    this.scoreTween?.stop();
    const counter = { value: this.shownScore };
    this.scoreTween = this.scene.tweens.add({
      targets: counter,
      value,
      duration: 500,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        this.shownScore = Math.round(counter.value);
        this.scoreText.setText(String(this.shownScore));
      },
    });
  }

  /** `progress`: 0–1 trong cỡ hiện tại */
  setGrowth(progress: number, tier: number, animate = true): void {
    this.growthFish.setTexture(playerFrame(tier, 0));
    this.growthFish.setScale((14 + tier * 4) / this.growthFish.height);
    const from = { value: this.growth };
    this.growth = progress;
    const draw = (value: number) => {
      this.growthFill.clear();
      if (value <= 0) return;
      const width = Math.max(12, this.growthWidth * value);
      this.growthFill.fillStyle(THEME.hex.green).fillRoundedRect(0, -6, width, 12, 6);
      this.growthFill.fillStyle(THEME.hex.white, 0.35).fillRoundedRect(4, -5, width - 8, 3, 2);
    };
    if (!animate) {
      draw(progress);
      return;
    }
    this.scene.tweens.add({
      targets: from,
      value: progress,
      duration: 400,
      ease: 'Cubic.easeOut',
      onUpdate: () => draw(from.value),
    });
  }

  private pill(x: number, y: number, width: number): void {
    this.scene.add
      .graphics()
      .setDepth(DEPTH.HUD)
      .fillStyle(THEME.hex.ink, 0.75)
      .fillRoundedRect(x, y - PILL_H / 2, width, PILL_H, PILL_H / 2);
  }
}
