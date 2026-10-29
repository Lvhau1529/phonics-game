/**
 * Ảnh / âm thanh của Halloween Candy Quest (sinh bởi tools/halloween_candy_quest/build_assets.py vào
 * public/assets/halloween-candy-quest/). Sprite là pixel art: hiển thị với `image-rendering: pixelated`.
 */
const ROOT = 'assets/halloween-candy-quest';

export const wordImageUrl = (id: string): string => `${ROOT}/words/${id}.png`;
export const backgroundUrl = (zone: string): string => `${ROOT}/bg/${zone}.png`;
export const buildingUrl = (name: string): string => `${ROOT}/buildings/${name}.png`;
export const doorUrl = (name: string): string => `${ROOT}/doors/${name}.png`;
export const npcUrl = (name: string): string => `${ROOT}/npcs/${name}.png`;
export const propUrl = (name: string): string => `${ROOT}/props/${name}.png`;
export const candyUrl = (name: string): string => `${ROOT}/candy/${name}.png`;
export const basketUrl = (level: 'empty' | 'half' | 'full'): string => `${ROOT}/baskets/${level}.png`;
export const fxUrl = (name: string): string => `${ROOT}/fx/${name}.png`;
/** Spritesheet 96×240: 2 cột (frame) × 5 hàng (idle, walk, knock, celebrate, try_again), ô 48px */
export const characterSheetUrl = (id: string): string => `${ROOT}/chars/${id}.png`;
export const portraitUrl = (id: string): string => `${ROOT}/chars/${id}_portrait.png`;
/** [ogg, mp3] — trình duyệt chọn định dạng phát được */
export const soundUrls = (key: string): [string, string] => [
  `${ROOT}/sfx/${key}.ogg`,
  `${ROOT}/sfx/${key}.mp3`,
];

export const CANDIES = [
  'blue_wrap',
  'candy_corn',
  'green_star',
  'lollipop',
  'orange_wrap',
  'pink_sweet',
  'pink_wrap',
  'purple_sweet',
  'purple_wrap',
  'red_heart',
  'round_lollipop',
  'star_candy',
] as const;
