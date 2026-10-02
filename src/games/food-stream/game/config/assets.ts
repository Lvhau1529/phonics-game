/**
 * Âm thanh của Food Stream (thư mục `public/assets/food-stream/music/`, sinh bởi tools/build_audio.py).
 * Ảnh: xem sprites.ts (cùng thư mục). SFX: thư viện chung platform/audio/sfx.ts.
 */
import { audioUrls } from '@/platform/audio/sfx';

const ASSET_ROOT = 'assets/food-stream';

/** Nhạc nền (plan §13) */
export const MUSIC = {
  /** Main menu / chọn chế độ / chọn gói */
  MENU: 'bgm_menu',
  /** Chơi Solo */
  GAMEPLAY: 'bgm_gameplay',
  /** Classroom — đội A đấu đội B */
  CLASSROOM: 'bgm_classroom',
  /** Màn kết quả — chỉ vào sau khi nhạc kết thúc (JINGLE) phát xong */
  REWARD: 'bgm_reward',
} as const;
export type MusicKey = (typeof MUSIC)[keyof typeof MUSIC];

export const MUSIC_VOLUME: Record<MusicKey, number> = {
  bgm_menu: 0.24,
  bgm_gameplay: 0.2,
  bgm_classroom: 0.2,
  bgm_reward: 0.24,
};

/** Nhạc kết thúc lượt: phát một mình (nhạc nền tắt), xong mới sang nhạc màn kết quả */
export const JINGLE = { key: 'jingle_level_complete', volume: 0.4 } as const;

export const musicUrls = (key: string): string[] => audioUrls(`${ASSET_ROOT}/music/${key}`);
