/**
 * Âm thanh của Phonics Ocean.
 *   - SFX riêng: 5 SFX của resource pack v2 (`public/assets/phonics-ocean/sfx/`, tools/build_audio.py)
 *   - SFX chung: platform/audio/sfx.ts (nút, đếm ngược, hết giờ...)
 *   - Nhạc nền: pack chưa có nhạc -> dùng chung bộ nhạc vui của Food Stream (`assets/food-stream/music/`)
 * Ảnh: xem sprites.ts (cùng thư mục).
 */
import { audioUrls } from '@/platform/audio/sfx';

export const OCEAN_SFX = {
  CORRECT: 'ocean_correct',
  WRONG: 'ocean_wrong_soft',
  LEVEL_UP: 'ocean_level_up',
  COLLECT: 'ocean_collect',
  DANGER: 'ocean_danger',
} as const;
export type OceanSfxKey = (typeof OCEAN_SFX)[keyof typeof OCEAN_SFX];

/** key trong game -> tên file trong public/assets/phonics-ocean/sfx/ */
const SFX_FILES: Record<OceanSfxKey, string> = {
  ocean_correct: 'correct',
  ocean_wrong_soft: 'wrong_soft',
  ocean_level_up: 'level_up',
  ocean_collect: 'collect',
  ocean_danger: 'danger',
};

export const OCEAN_SFX_VOLUME: Record<OceanSfxKey, number> = {
  ocean_correct: 0.55,
  ocean_wrong_soft: 0.45,
  ocean_level_up: 0.6,
  ocean_collect: 0.5,
  ocean_danger: 0.5,
};

export const oceanSfxUrls = (key: OceanSfxKey): string[] =>
  audioUrls(`assets/phonics-ocean/sfx/${SFX_FILES[key]}`);

export const MUSIC = {
  MENU: 'bgm_menu',
  GAMEPLAY: 'bgm_gameplay',
  REWARD: 'bgm_reward',
} as const;
export type MusicKey = (typeof MUSIC)[keyof typeof MUSIC];

export const MUSIC_VOLUME: Record<MusicKey, number> = {
  bgm_menu: 0.22,
  bgm_gameplay: 0.18,
  bgm_reward: 0.22,
};

/** Nhạc kết thúc lượt: phát một mình, xong mới sang nhạc màn kết quả */
export const JINGLE = { key: 'jingle_level_complete', volume: 0.4 } as const;

export const musicUrls = (key: string): string[] => audioUrls(`assets/food-stream/music/${key}`);
