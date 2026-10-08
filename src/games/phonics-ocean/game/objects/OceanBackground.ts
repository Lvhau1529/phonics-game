/**
 * Nền biển của một biome: ảnh nền phủ kín màn (cắt giữa), lớp nước phủ nhẹ cho chữ trên cá dễ đọc,
 * tia sáng lung linh và bong bóng nổi lên (GAMEPLAY_AND_ASSET_GUIDE §11: bubble trail tăng cảm giác chuyển động).
 */
import Phaser from 'phaser';
import type { Biome } from '@/games/phonics-ocean/content/schema';
import { BIOMES, DEPTH } from '@/games/phonics-ocean/game/config/theme';
import { FX, FX_SIZE } from '@/games/phonics-ocean/game/systems/textures';

const BUBBLE_EVERY_MS = 450;

export default class OceanBackground {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly timer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, biome: Biome, area: Phaser.Geom.Rectangle) {
    const config = BIOMES[biome];
    const image = scene.add.image(area.centerX, area.centerY, config.image).setDepth(DEPTH.BACKGROUND);
    image.setScale(Math.max(area.width / image.width, area.height / image.height));
    const tint = scene.add
      .rectangle(area.x, area.y, area.width, area.height, config.tint, config.tintAlpha)
      .setOrigin(0)
      .setDepth(DEPTH.BACKGROUND);
    this.objects.push(image, tint);

    // Tia sáng từ mặt nước, đung đưa chậm
    for (let i = 0; i < 3; i += 1) {
      const x = area.x + area.width * (0.2 + i * 0.3);
      const ray = scene.add
        .triangle(x, area.y, 0, 0, 46, 0, 110, area.height * 0.9, 0xffffff, 0.06)
        .setOrigin(0, 0)
        .setDepth(DEPTH.AMBIENT)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.objects.push(ray);
      scene.tweens.add({
        targets: ray,
        alpha: { from: 0.03, to: 0.09 },
        x: x + 24,
        duration: 3200 + i * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.timer = scene.time.addEvent({
      delay: BUBBLE_EVERY_MS,
      loop: true,
      callback: () => this.bubble(scene, area),
    });
  }

  /** Đổi biome (màn Setup): xoá nền cũ, dừng bong bóng */
  destroy(): void {
    this.timer.remove();
    this.objects.forEach((object) => object.destroy());
  }

  private bubble(scene: Phaser.Scene, area: Phaser.Geom.Rectangle): void {
    const x = Phaser.Math.Between(area.x + 8, area.right - 8);
    const size = Phaser.Math.Between(5, FX_SIZE.bubble);
    const bubble = scene.add
      .image(x, area.bottom + 10, FX.BUBBLE)
      .setDisplaySize(size, size)
      .setAlpha(0.7)
      .setDepth(DEPTH.AMBIENT);
    scene.tweens.add({
      targets: bubble,
      y: area.y + Phaser.Math.Between(0, area.height * 0.4),
      x: x + Phaser.Math.Between(-20, 20),
      alpha: 0,
      duration: Phaser.Math.Between(4000, 7000),
      ease: 'Sine.easeIn',
      onComplete: () => bubble.destroy(),
    });
  }
}
