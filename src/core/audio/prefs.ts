/**
 * Cài đặt âm thanh dùng chung cho mọi game: SOUND · MUSIC · VOICE.
 * React (nút bật/tắt) và Phaser (AudioSystem, giọng đọc) cùng đọc / ghi store này.
 */
import { createStore } from '@/core/store/createStore';
import { readJson, writeJson } from '@/core/storage/storage';

export interface Prefs {
  sfx: boolean;
  music: boolean;
  /** Đọc to âm / từ (Web Speech) */
  voice: boolean;
}

const PREFS_KEY = 'phonics-arcade:prefs';
/** Bản Bread Catcher cũ lưu prefs chung với save của game */
const LEGACY_KEY = 'phonics-bread-catcher-v2';

const DEFAULT_PREFS: Prefs = { sfx: true, music: true, voice: true };

function loadPrefs(): Prefs {
  const stored = readJson<Prefs>(PREFS_KEY) ?? readJson<{ prefs: Prefs }>(LEGACY_KEY)?.prefs ?? {};
  return {
    sfx: stored.sfx ?? DEFAULT_PREFS.sfx,
    music: stored.music ?? DEFAULT_PREFS.music,
    voice: stored.voice ?? DEFAULT_PREFS.voice,
  };
}

export const prefsStore = createStore<Prefs>(loadPrefs());
const savePrefs = () => writeJson(PREFS_KEY, prefsStore.get());
// Ghi ngay dưới key mới: save cũ của Bread Catcher sẽ bị xoá khi game đó lưu dữ liệu
savePrefs();
prefsStore.subscribe(savePrefs);

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
  prefsStore.set((prefs) => ({ ...prefs, [key]: value }));
}
