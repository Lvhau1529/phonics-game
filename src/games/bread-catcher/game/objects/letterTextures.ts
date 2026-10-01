/**
 * Texture "bánh chữ": sprite bánh pixel-art + chữ cái vẽ bằng font Andika.
 *
 * Chữ được vẽ LIVE (không nướng sẵn vào ảnh — plan §29) nhưng gộp vào một texture
 * để chữ rơi vẫn là 1 Arcade Sprite: xoay, mờ, tween, physics đều áp cho cả bánh lẫn chữ.
 * Texture có độ phân giải gấp RENDER_SCALE (bánh phóng nearest, chữ vẽ sắc nét),
 * sprite hiển thị ở scale 1 / RENDER_SCALE. Bánh của Kids Bakery pack đã vẽ sẵn ở 2x
 * (`scale` trong sprites.json) và có `letter` = tâm lòng kem trống để đặt chữ.
 */
import type Phaser from 'phaser';
import { SPRITE_MANIFEST, type SpriteManifest } from '@/games/bread-catcher/game/config/assets';
import { THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { RENDER_SCALE } from '@/platform/phaser/viewport';

/** Cỡ chữ so với cạnh ngắn của bánh */
const LETTER_SIZE_RATIO = 0.6;
/**
 * Bánh có lòng kem (Kids Bakery pack): chữ phủ vừa lòng kem nhưng không nhỏ hơn
 * MIN_LETTER_RATIO cạnh ngắn — bé vẫn đọc được trên bánh có lòng kem hẹp (bánh su, bánh cuộn).
 */
const CREAM_FILL_RATIO = 2.2;
const MIN_LETTER_RATIO = 0.5;

export const LETTER_TEXTURE_SCALE = 1 / RENDER_SCALE;

function letterTextureKey(bread: string, letter: string): string {
  return `lb_${bread}_${letter}`;
}

/** Tạo texture (một lần, lazy) và trả về key */
export function ensureLetterTexture(scene: Phaser.Scene, bread: string, letter: string): string {
  const key = letterTextureKey(bread, letter);
  if (scene.textures.exists(key)) return key;

  const info = (scene.cache.json.get(SPRITE_MANIFEST.key) as SpriteManifest | undefined)?.[bread];
  // Ảnh vẽ sẵn ở 2x thì giữ nguyên, ảnh 1x phóng nearest lên RENDER_SCALE
  const zoom = RENDER_SCALE / (info?.scale ?? 1);
  const source = scene.textures.get(bread).getSourceImage();
  const width = source.width * zoom;
  const height = source.height * zoom;
  const texture = scene.textures.addDynamicTexture(key, width, height);
  if (!texture) return bread;

  const breadImage = scene.make.image({ key: bread }, false).setOrigin(0).setScale(zoom);
  const shortSide = Math.min(width, height);
  const cream = info?.letter;
  const fontSize = Math.round(
    cream
      ? Math.min(
          shortSide * LETTER_SIZE_RATIO,
          Math.max(shortSide * MIN_LETTER_RATIO, cream.radius * zoom * CREAM_FILL_RATIO),
        )
      : shortSide * LETTER_SIZE_RATIO,
  );
  const label = scene.make
    .text(
      {
        x: cream ? cream.x * zoom : width / 2,
        y: cream ? cream.y * zoom : height / 2,
        text: letter,
        style: {
          fontFamily: THEME.fonts.learning,
          fontStyle: '700',
          fontSize: `${fontSize}px`,
          color: THEME.colors.darkBrown,
          stroke: THEME.colors.cream,
          strokeThickness: Math.round(fontSize * 0.2),
        },
      },
      false,
    )
    .setOrigin(0.5);

  texture.draw(breadImage, 0, 0);
  texture.draw(label);
  breadImage.destroy();
  label.destroy();
  return key;
}
