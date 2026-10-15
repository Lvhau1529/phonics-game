/**
 * Ảnh của Little English Explorers (sinh bởi tools/english_explorers/build_assets.py vào
 * public/assets/english-explorers/pictures/).
 */
import type { PictureName } from '@/games/english-explorers/content/worlds';

export const pictureUrl = (name: PictureName): string => `assets/english-explorers/pictures/${name}.webp`;
