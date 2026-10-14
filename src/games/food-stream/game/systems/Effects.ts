/**
 * Hiệu ứng hình ảnh dùng trong lượt chơi: tim bay, lấp lánh, vụn bánh, điểm bay lên,
 * chữ lớn giữa màn hình, sticker COMBO / PERFECT. Không nháy sáng mạnh (plan §26).
 */
import Phaser from 'phaser';
import { DEPTH, THEME, TIMING } from '@/games/food-stream/game/config/theme';
import { addText } from '@/games/food-stream/game/ui/text';
import { view } from '@/core/phaser/view';

const CRUMB_COLORS = [0xd99a5b, 0xb8733d, 0xf2c48d];

export interface BannerOptions {
  color?: string;
  holdMs?: number;
  /** Cỡ chữ (px logic) */
  size?: number;
}

export default class Effects {
  /**
   * @param bannerArea vùng đặt chữ lớn (mặc định cả màn hình; màn chơi ngang dùng sân khấu
   *                   để chữ không nằm vắt qua khe giữa sân khấu và khay món)
   */
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly bannerArea?: Phaser.Geom.Rectangle,
  ) {}

  /** Tim bay lên từ một điểm (thả tim của khán giả) */
  hearts(x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i += 1) {
      const heart = this.scene.add
        .image(x + Phaser.Math.Between(-16, 16), y, 'ui.heart')
        .setDepth(DEPTH.STAGE_FX);
      heart.setScale(Phaser.Math.Between(14, 22) / heart.height).setAlpha(0.95);
      this.scene.tweens.add({
        targets: heart,
        y: y - Phaser.Math.Between(70, 130),
        x: heart.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1400),
        delay: i * 90,
        ease: 'Sine.easeOut',
        onComplete: () => heart.destroy(),
      });
    }
  }

  sparkles(x: number, y: number, count = 6, radius = 50): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const sparkle = this.scene.add.image(x, y, 'ui.sparkle').setDepth(DEPTH.FLYING + 1);
      sparkle.setScale(18 / sparkle.height);
      this.scene.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        angle: 90,
        alpha: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  /** Vụn bánh khi ăn xong (FINISHED) */
  crumbs(x: number, y: number): void {
    for (let i = 0; i < 9; i += 1) {
      const crumb = this.scene.add
        .circle(x, y, Phaser.Math.Between(2, 4), CRUMB_COLORS[i % CRUMB_COLORS.length])
        .setDepth(DEPTH.FLYING);
      this.scene.tweens.add({
        targets: crumb,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(10, 40),
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeIn',
        onComplete: () => crumb.destroy(),
      });
    }
  }

  popup(x: number, y: number, text: string, color: string = THEME.colors.gold): void {
    const label = addText(this.scene, x, y, text, 'popup', { color }).setDepth(DEPTH.BANNER);
    this.scene.tweens.add({
      targets: label,
      y: y - 42,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  /** Chữ lớn giữa màn hình (GET READY!, 3-2-1, TEAM A...) */
  banner(
    text: string,
    { color = THEME.colors.gold, holdMs = TIMING.bannerHold, size = 40 }: BannerOptions = {},
  ): Promise<void> {
    const { width, height } = view(this.scene);
    const area = this.bannerArea ?? new Phaser.Geom.Rectangle(0, 0, width, height);
    const label = addText(this.scene, area.centerX, area.y + area.height * 0.42, text, 'banner', {
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

  /** Sticker COMBO / PERFECT! trong art board */
  sticker(key: 'ui.combo' | 'ui.perfect', x: number, y: number, width = 150): void {
    const image = this.scene.add.image(x, y, key).setDepth(DEPTH.BANNER);
    const scale = width / image.width;
    image.setScale(scale * 0.3).setAngle(-8);
    this.scene.tweens.chain({
      targets: image,
      tweens: [
        { scale, angle: 4, duration: 260, ease: 'Back.easeOut' },
        { angle: -4, duration: 500, yoyo: true },
        { alpha: 0, duration: 250 },
      ],
      onComplete: () => image.destroy(),
    });
  }
}
