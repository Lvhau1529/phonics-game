/**
 * Ảnh của Phonics Ocean: manifest sinh bởi tools/phonics_ocean/build_sprites.py (key ổn định -> file).
 * Import thẳng vào bundle nên React (màn kết quả) và Phaser (preload) dùng chung.
 */
import manifest from '@/games/phonics-ocean/game/config/sprites.json';

export interface SpriteInfo {
  path: string;
  width: number;
  height: number;
}

export const SPRITES: Readonly<Record<string, SpriteInfo>> = manifest;

export const spriteUrl = (key: string): string | undefined => SPRITES[key]?.path;

/** Số khung bơi của cá người chơi theo cỡ (1–3) */
export const PLAYER_FRAMES: Record<number, number> = { 1: 6, 2: 6, 3: 2 };

export const playerFrame = (tier: number, frame: number): string => `player.${tier}.${frame}`;

/** Cá mồi mang chữ: 25 màu */
export const PREY_KEYS: readonly string[] = Object.keys(SPRITES).filter((key) => key.startsWith('prey.'));

/** Khung bơi của từng loại cá săn mồi */
export const PREDATOR_FRAMES: Record<string, readonly string[]> = Object.keys(SPRITES)
  .filter((key) => key.startsWith('predator.'))
  .reduce<Record<string, string[]>>((frames, key) => {
    const kind = key.split('.')[1];
    (frames[kind] ??= []).push(key);
    return frames;
  }, {});

/** Đàn cá kiểu Feeding Frenzy: "tiny.pink" -> các khung bơi (key sprites.json "school.tiny.pink.<i>") */
export const SCHOOL_FRAMES: Record<string, readonly string[]> = Object.keys(SPRITES)
  .filter((key) => key.startsWith('school.'))
  .reduce<Record<string, string[]>>((frames, key) => {
    const [, size, kind] = key.split('.');
    (frames[`${size}.${kind}`] ??= []).push(key);
    return frames;
  }, {});
