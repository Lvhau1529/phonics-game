/**
 * Background của stage, tự chọn bản dọc (360x800) hoặc ngang (960x540, "_wide")
 * theo hướng màn hình và phủ kín màn hình (cắt bớt phần thừa, không méo).
 */
import type Phaser from 'phaser';
import { DEPTH } from '@/games/bread-catcher/game/config/gameConfig';
import { isLandscape, view } from '@/core/phaser/view';

/** Key texture phù hợp hướng màn hình, vd "bg_bakery_01" -> "bg_bakery_01_wide" */
function backgroundKey(scene: Phaser.Scene, key: string): string {
  const wide = `${key}_wide`;
  return isLandscape(scene) && scene.textures.exists(wide) ? wide : key;
}

/** Đổi ảnh (giữ tint) và scale kiểu "cover" */
export function setStageBackground(image: Phaser.GameObjects.Image, key: string): void {
  const { width, height } = view(image.scene);
  image.setTexture(backgroundKey(image.scene, key));
  image.setScale(Math.max(width / image.width, height / image.height));
}

export function addStageBackground(
  scene: Phaser.Scene,
  key: string,
  /** Tint để làm tối nhẹ background (0xffffff = giữ nguyên) */
  tint = 0xffffff,
): Phaser.GameObjects.Image {
  const { width, height } = view(scene);
  const image = scene.add
    .image(width / 2, height / 2, backgroundKey(scene, key))
    .setDepth(DEPTH.BACKGROUND)
    .setTint(tint);
  setStageBackground(image, key);
  return image;
}
