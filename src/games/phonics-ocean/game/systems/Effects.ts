/**
 * Hiệu ứng trong lượt chơi: lấp lánh khi ăn, bong bóng toé, điểm bay lên, chữ lớn giữa màn hình.
 * Không nháy sáng mạnh (trẻ mẫu giáo).
 */
import Phaser from 'phaser';
import { DEPTH, THEME } from '@/games/phonics-ocean/game/config/theme';
import { FX } from '@/games/phonics-ocean/game/systems/textures';
import { addText } from '@/games/phonics-ocean/game/ui/text';

export interface BannerOptions {
  color?: string;
  holdMs?: number;
  size?: number;
}

export default class Effects {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly area: Phaser.Geom.Rectangle,
  ) {}

  sparkles(x: number, y: number, count = 7, radius = 42): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const spark = this.scene.add.image(x, y, FX.SPARK).setDisplaySize(14, 14).setDepth(DEPTH.FX);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        angle: 120,
        alpha: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  bubbles(x: number, y: number, count = 6): void {
    for (let i = 0; i < count; i += 1) {
      const size = Phaser.Math.Between(6, 13);
      const bubble = this.scene.add.image(x, y, FX.BUBBLE).setDisplaySize(size, size).setDepth(DEPTH.FX);
      this.scene.tweens.add({
        targets: bubble,
        x: x + Phaser.Math.Between(-26, 26),
        y: y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: Phaser.Math.Between(500, 900),
        ease: 'Sine.easeOut',
        onComplete: () => bubble.destroy(),
      });
    }
  }

  popup(x: number, y: number, text: string, color: string = THEME.colors.gold, size = 20): void {
    const label = addText(this.scene, x, y, text, 'popup', { color, fontSize: `${size}px` }).setDepth(
      DEPTH.BANNER,
    );
    this.scene.tweens.add({
      targets: label,
      y: y - 40,
      alpha: 0,
      duration: 950,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  /** Chữ lớn giữa vùng chơi (GET READY!, BIGGER!, LEVEL CLEAR!...) */
  banner(
    text: string,
    { color = THEME.colors.gold, holdMs = 800, size = 40 }: BannerOptions = {},
  ): Promise<void> {
    const { area } = this;
    const label = addText(this.scene, area.centerX, area.y + area.height * 0.4, text, 'banner', {
      color,
      fontSize: `${size}px`,
    })
      .setDepth(DEPTH.BANNER)
      .setScale(0.3);
    label.setWordWrapWidth(area.width - 20);
    return new Promise((resolve) => {
      this.scene.tweens.chain({
        targets: label,
        tweens: [
          { scale: 1, duration: 240, ease: 'Back.easeOut' },
          { scale: 1, duration: holdMs },
          { alpha: 0, scale: 1.2, duration: 200 },
        ],
        onComplete: () => {
          label.destroy();
          resolve();
        },
      });
    });
  }
}
