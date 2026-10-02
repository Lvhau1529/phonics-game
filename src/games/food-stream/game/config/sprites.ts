/**
 * Ảnh của Food Stream: manifest sinh bởi tools/food_stream/build_sprites.py (key ổn định -> file).
 * Import thẳng vào bundle nên React (thẻ tranh ở màn kết quả) và Phaser (preload) dùng chung,
 * và nội dung biết ngay tranh nào đang có (vd: "ostrich" chưa có tranh).
 *
 * Texture xuất ở độ phân giải canvas (gấp 2 toạ độ logic) -> hiển thị ở TEXTURE_SCALE.
 */
import manifest from '@/games/food-stream/game/config/sprites.json';
import { RENDER_SCALE } from '@/platform/phaser/viewport';

export interface SpriteInfo {
  path: string;
  width: number;
  height: number;
  anchors?: { badge?: { x: number; y: number; r: number } };
}

export const SPRITES: Readonly<Record<string, SpriteInfo>> = manifest;

export type SpriteKey = keyof typeof manifest;

/** Scale hiển thị để 1 pixel texture = 1 pixel canvas */
export const TEXTURE_SCALE = 1 / RENDER_SCALE;

export const hasSprite = (key: string | undefined): key is string => key !== undefined && key in SPRITES;

export const spriteUrl = (key: string): string | undefined => SPRITES[key]?.path;
