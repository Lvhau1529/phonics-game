/**
 * Bình luận "khán giả" nổi lên ở góc sân khấu (plan §12) — chọn từ danh sách có sẵn,
 * không có chat / mạng thật.
 */
import type Phaser from 'phaser';
import { DEPTH, THEME } from '@/games/food-stream/game/config/theme';
import { addText } from '@/games/food-stream/game/ui/text';

const MAX_VISIBLE = 3;
const BUBBLE_HEIGHT = 24;
const GAP = 4;
const LIFETIME_MS = 2800;
const AVATAR_COLORS = [0xffb3c7, 0x9fd0ff, 0xffe08a, 0xb9f0a8, 0xd7c2ff];

export default class CommentFeed {
  private readonly bubbles: Phaser.GameObjects.Container[] = [];
  private colorIndex = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    /** Vùng hiện bình luận (trong sân khấu), bong bóng xếp từ dưới lên, căn phải */
    private readonly area: Phaser.Geom.Rectangle,
  ) {}

  post(message: string): void {
    const text = addText(this.scene, 0, 0, message, 'comment').setOrigin(0, 0.5);
    const width = Math.min(this.area.width, text.width + 34);
    const background = this.scene.add.graphics();
    background
      .fillStyle(THEME.hex.white, 0.92)
      .fillRoundedRect(0, -BUBBLE_HEIGHT / 2, width, BUBBLE_HEIGHT, BUBBLE_HEIGHT / 2);
    const avatar = this.scene.add.circle(12, 0, 8, AVATAR_COLORS[this.colorIndex++ % AVATAR_COLORS.length]);
    text.setX(24);
    const bubble = this.scene.add
      .container(this.area.right - width, this.area.bottom, [background, avatar, text])
      .setDepth(DEPTH.STAGE_FX)
      .setAlpha(0);

    this.bubbles.unshift(bubble);
    this.bubbles.splice(MAX_VISIBLE).forEach((old) => this.dismiss(old));
    this.bubbles.forEach((item, index) => {
      this.scene.tweens.add({
        targets: item,
        y: this.area.bottom - BUBBLE_HEIGHT / 2 - index * (BUBBLE_HEIGHT + GAP),
        alpha: 1,
        duration: 220,
      });
    });
    this.scene.time.delayedCall(LIFETIME_MS, () => {
      // Bong bóng đã bị đẩy ra (quá MAX_VISIBLE) thì đã được xoá rồi
      const index = this.bubbles.indexOf(bubble);
      if (index < 0) return;
      this.bubbles.splice(index, 1);
      this.dismiss(bubble);
    });
  }

  private dismiss(bubble: Phaser.GameObjects.Container): void {
    this.scene.tweens.add({ targets: bubble, alpha: 0, duration: 250, onComplete: () => bubble.destroy() });
  }
}
