/**
 * Ảnh giao diện dùng chung cho mọi game (Phonics Arcade Bee pack — sinh bởi tools/arcade_ui/build_ui.py
 * vào `public/assets/shared/ui/`). Một bộ icon cho mọi game để cùng một nút luôn trông giống nhau.
 */
const UI = 'assets/shared/ui';

export const ICONS = {
  back: `${UI}/icons/back.png`,
  close: `${UI}/icons/close.png`,
  play: `${UI}/icons/play.png`,
  next: `${UI}/icons/next.png`,
  previous: `${UI}/icons/previous.png`,
  update: `${UI}/icons/update.png`,
  soundOn: `${UI}/icons/sound_on.png`,
  soundOff: `${UI}/icons/sound_off.png`,
  musicOn: `${UI}/icons/music_on.png`,
  musicOff: `${UI}/icons/music_off.png`,
  voiceOn: `${UI}/icons/voice_on.png`,
  voiceOff: `${UI}/icons/voice_off.png`,
  // Tài khoản: xếp hạng, hồ sơ, thông báo
  trophy: `${UI}/icons/trophy.png`,
  medal: `${UI}/icons/medal.png`,
  crown: `${UI}/icons/crown.png`,
  star: `${UI}/icons/star_filled.png`,
  notificationDot: `${UI}/icons/notification_dot.png`,
  check: `${UI}/icons/check.png`,
  settings: `${UI}/icons/settings.png`,
  gem: `${UI}/gems/gem.png`,
  gemSmall: `${UI}/gems/gem_small.png`,
  gemBurst: `${UI}/gems/gem_burst.png`,
  padlock: `${UI}/gems/padlock.png`,
  unlockBurst: `${UI}/gems/unlock_burst.png`,
} as const;

export type IconName = keyof typeof ICONS;

/** Linh vật ong cho hộp thoại / màn chờ — ảnh cảnh vuông, khung bo do CSS vẽ (mixin `mascot-frame`) */
export const MASCOT = {
  encourage: `${UI}/mascot/encourage.webp`,
  celebrate: `${UI}/mascot/celebrate.webp`,
  comingSoon: `${UI}/mascot/coming_soon.webp`,
  rotate: `${UI}/mascot/rotate.webp`,
  loading: `${UI}/mascot/loading.webp`,
  error: `${UI}/mascot/error.webp`,
  hello: `${UI}/mascot/hello.webp`,
  /** Ong ngủ: danh sách trống (chưa có thông báo...) */
  sleep: `${UI}/mascot/sleep.webp`,
} as const;

export const COMING_SOON_COVER = `${UI}/coming_soon_cover.webp`;

/** Nền màn chọn game (vườn hoa, tổ ong) */
export const HUB_BACKGROUND = {
  portrait: `${UI}/hub_bg_portrait.webp`,
  landscape: `${UI}/hub_bg_landscape.webp`,
} as const;
