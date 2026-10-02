/**
 * Một món ăn mang nhãn học (chữ cái, hoặc thẻ tranh + từ) — phần "bay vào miệng" của lựa chọn.
 * Chữ in sẵn trên ảnh đồ ăn được che bằng huy hiệu chữ (anchor `badge` trong sprites.json);
 * nhãn học không gắn với tên texture (plan §19).
 * Trạng thái ăn (plan §11): FULL -> BITE_1 -> BITE_2 -> (vụn bánh) FINISHED — cùng một object, đổi frame.
 */
import Phaser from 'phaser';
import { THEME } from '@/games/food-stream/game/config/theme';
import { addText } from '@/games/food-stream/game/ui/text';
import type { Choice } from '@/games/food-stream/session/types';
import { SPRITES } from '@/games/food-stream/game/config/sprites';

/** Mọi món ăn có trong manifest (không tính frame cắn) */
export const FOOD_KEYS: readonly string[] = Object.keys(SPRITES).filter(
  (key) => key.startsWith('food.') && !key.includes('.bite'),
);

export type BiteFrame = 0 | 1 | 2;

/** Thẻ tranh cao = rộng × tỉ lệ này */
export const CARD_HEIGHT_RATIO = 1.12;

export default class FoodPiece extends Phaser.GameObjects.Container {
  private readonly food: Phaser.GameObjects.Image;
  private readonly badge: Phaser.GameObjects.Container;
  private readonly card: Phaser.GameObjects.Container | null;

  /**
   * @param size cạnh lớn nhất của món ăn (px logic)
   * @param cardWidth chiều rộng thẻ tranh (chỉ lựa chọn dạng từ)
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly foodKey: string,
    readonly choice: Choice,
    readonly size: number,
    cardWidth = size * 1.1,
  ) {
    super(scene, x, y);
    this.food = scene.add.image(0, 0, foodKey);
    const scale = size / Math.max(this.food.width, this.food.height);
    this.food.setScale(scale);
    this.add(this.food);

    // Chữ in sẵn trên đồ ăn luôn bị che: lựa chọn chữ cái -> huy hiệu chữ, lựa chọn từ -> huy hiệu tim
    this.badge = this.createBadge(scale, choice.picture ? null : choice.label);
    this.card = choice.picture ? this.pictureCard(cardWidth) : null;
    this.add(this.card ? [this.badge, this.card] : this.badge);
    scene.add.existing(this);
  }

  /** Đổi frame đang ăn; bắt đầu cắn thì thẻ tranh biến mất (huy hiệu vẫn che chữ in sẵn) */
  bite(frame: BiteFrame): void {
    this.food.setTexture(frame === 0 ? this.foodKey : `${this.foodKey}.bite${frame}`);
    this.card?.setVisible(frame === 0);
  }

  setGrey(grey: boolean): void {
    this.food.setTint(grey ? 0x9a9a9a : 0xffffff);
    this.badge.setAlpha(grey ? 0.5 : 1);
    this.card?.setAlpha(grey ? 0.5 : 1);
  }

  /** Huy hiệu đặt đúng chỗ chữ in sẵn trên đồ ăn: chữ cái học, hoặc trái tim (null) */
  private createBadge(scale: number, letter: string | null): Phaser.GameObjects.Container {
    const anchor = SPRITES[this.foodKey].anchors?.badge;
    const { width, height } = this.food;
    const cx = anchor ? (anchor.x - width / 2) * scale : 0;
    const cy = anchor ? (anchor.y - height / 2) * scale : 0;
    const r = Math.max(14, (anchor?.r ?? width * 0.2) * scale * 1.08);

    const circle = this.scene.add.graphics();
    circle.fillStyle(THEME.hex.cream).fillCircle(0, 0, r);
    circle.lineStyle(3, THEME.hex.pink).strokeCircle(0, 0, r);
    const content = letter
      ? addText(this.scene, 0, r * 0.04, letter, 'learning', { fontSize: `${Math.round(r * 1.5)}px` })
      : this.scene.add.image(0, 0, 'ui.heart');
    if (content instanceof Phaser.GameObjects.Image) content.setScale((r * 1.2) / content.height);
    return this.scene.add.container(cx, cy, [circle, content]);
  }

  /** Thẻ tranh cắm trên món ăn (lựa chọn dạng từ): tranh + từ */
  private pictureCard(cardWidth: number): Phaser.GameObjects.Container {
    const cardHeight = cardWidth * CARD_HEIGHT_RATIO;
    const top = -this.food.displayHeight / 2 - cardHeight + this.size * 0.18;
    const card = this.scene.add.graphics();
    card.fillStyle(THEME.hex.white).fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 10);
    card.lineStyle(3, THEME.hex.pink).strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 10);

    const picture = this.scene.add.image(0, cardHeight * 0.4, this.choice.picture!);
    picture.setScale((cardWidth * 0.72) / Math.max(picture.width, picture.height));
    const word = addText(this.scene, 0, cardHeight * 0.86, this.choice.label, 'learning', {
      fontSize: `${Math.round(cardWidth * 0.19)}px`,
    });
    return this.scene.add.container(0, top, [card, picture, word]);
  }
}
