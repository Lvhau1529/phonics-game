/**
 * Thư viện SFX dùng chung cho mọi game (tools/build_audio.py), game nào cũng tải từ `assets/shared/sfx/`:
 *   - resource pack của Bread Catcher: nút bấm, đếm ngược, đúng / sai, hết giờ, kết quả...
 *     (volume theo audio_manifest.json của pack)
 *   - Phonics Arcade pack (_source/platform): giao diện chung — back, bật/tắt, mở/đóng hộp thoại,
 *     kim cương, mở khoá game, game sắp ra mắt
 */
export const SFX = {
  UI_CLICK: 'ui_click',
  UI_START: 'ui_start',
  COUNTDOWN_TICK: 'countdown_tick',
  COUNTDOWN_GO: 'countdown_go',
  DICE_ROLL: 'dice_roll',
  TEAM_SELECTED: 'team_selected',
  CORRECT_LETTER: 'correct_letter',
  WRONG_LETTER: 'wrong_letter',
  WORD_COMPLETE: 'word_complete',
  ROUND_COMPLETE: 'round_complete',
  PAUSE: 'pause',
  RESUME: 'resume',
  TIME_UP: 'time_up',
  FINAL_RESULTS: 'final_results',
  GIFT_OPEN: 'gift_open',
  UI_BACK: 'ui_back',
  UI_TOGGLE_ON: 'ui_toggle_on',
  UI_TOGGLE_OFF: 'ui_toggle_off',
  UI_OPEN: 'ui_open',
  UI_CLOSE: 'ui_close',
  UI_TAB: 'ui_tab',
  GEM_COLLECT: 'gem_collect',
  GEM_COUNT: 'gem_count',
  UNLOCK: 'unlock',
  LOCKED: 'locked',
  NOT_ENOUGH_GEMS: 'not_enough_gems',
  COMING_SOON: 'coming_soon',
  UPDATE_READY: 'update_ready',
} as const;

export type SfxKey = (typeof SFX)[keyof typeof SFX];

export const SFX_VOLUME: Record<SfxKey, number> = {
  ui_click: 0.35,
  ui_start: 0.45,
  countdown_tick: 0.52,
  countdown_go: 0.58,
  dice_roll: 0.5,
  team_selected: 0.6,
  correct_letter: 0.55,
  wrong_letter: 0.45,
  word_complete: 0.68,
  round_complete: 0.7,
  pause: 0.4,
  resume: 0.4,
  time_up: 0.6,
  final_results: 0.72,
  gift_open: 0.75,
  // Phonics Arcade pack: master chuẩn hoá -1 dB, nên hạ volume cho ngang SFX cũ
  ui_back: 0.3,
  ui_toggle_on: 0.32,
  ui_toggle_off: 0.32,
  ui_open: 0.4,
  ui_close: 0.4,
  ui_tab: 0.3,
  gem_collect: 0.45,
  gem_count: 0.18,
  unlock: 0.55,
  locked: 0.4,
  not_enough_gems: 0.45,
  coming_soon: 0.45,
  update_ready: 0.4,
};

/** .ogg trước (Chrome/Android/Firefox), .mp3 fallback (iOS Safari) */
export const audioUrls = (basePath: string): string[] => [`${basePath}.ogg`, `${basePath}.mp3`];

export const sfxUrls = (key: SfxKey): string[] => audioUrls(`assets/shared/sfx/${key}`);
