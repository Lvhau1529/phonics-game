/**
 * Âm thanh riêng của Halloween Candy Quest (12 SFX + nhạc nền của pack, public/assets/halloween-candy-quest/sfx/).
 * Game chỉ có màn React nên phát thẳng bằng AudioContext dùng chung; tôn trọng SOUND / MUSIC trong prefsStore.
 * Nhạc nền nhỏ (BGM_VOLUME) để không át giọng đọc từ (spec checklist D).
 */
import { soundUrls } from '@/games/halloween-candy-quest/app/assets';
import { getAudioContext, resumeAudio } from '@/core/audio/audioContext';
import { prefsStore } from '@/core/audio/prefs';

export const GAME_SFX = {
  click: 'button_click',
  knock: 'door_knock',
  doorOpen: 'door_open',
  correct: 'correct',
  candy: 'candy_collect',
  tryAgain: 'try_again_gentle',
  hint: 'hint_twinkle',
  chest: 'chest_open',
  nextTurn: 'next_turn',
  zone: 'zone_unlock',
  picker: 'team_picker',
  celebration: 'celebration',
} as const;

export type GameSfx = (typeof GAME_SFX)[keyof typeof GAME_SFX];

const VOLUME: Record<GameSfx, number> = {
  button_click: 0.35,
  door_knock: 0.6,
  door_open: 0.5,
  correct: 0.55,
  candy_collect: 0.55,
  try_again_gentle: 0.45,
  hint_twinkle: 0.45,
  chest_open: 0.5,
  next_turn: 0.5,
  zone_unlock: 0.55,
  team_picker: 0.55,
  celebration: 0.6,
};
const BGM = 'bgm_halloween_friendly_loop';
const BGM_VOLUME = 0.16;

const buffers = new Map<string, Promise<AudioBuffer | null>>();

function load(ctx: AudioContext, key: string): Promise<AudioBuffer | null> {
  let buffer = buffers.get(key);
  if (!buffer) {
    const [ogg, mp3] = soundUrls(key);
    const url = new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? ogg : mp3;
    buffer = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => null);
    buffers.set(key, buffer);
  }
  return buffer;
}

export function playGameSfx(key: GameSfx): void {
  const ctx = getAudioContext();
  if (!ctx || !prefsStore.get().sfx) return;
  resumeAudio();
  void load(ctx, key).then((buffer) => {
    if (!buffer) return;
    const gain = ctx.createGain();
    gain.gain.value = VOLUME[key];
    gain.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start();
  });
}

export function preloadGameSfx(): void {
  const ctx = getAudioContext();
  if (ctx) Object.values(GAME_SFX).forEach((key) => void load(ctx, key));
}

// ---------------------------------------------------------------- nhạc nền

let music: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
let wanted = false;

function startMusic(): void {
  const ctx = getAudioContext();
  if (!ctx || music || !wanted || !prefsStore.get().music) return;
  resumeAudio();
  void load(ctx, BGM).then((buffer) => {
    if (!buffer || music || !wanted || !prefsStore.get().music) return;
    const gain = ctx.createGain();
    gain.gain.value = BGM_VOLUME;
    gain.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    source.start();
    music = { source, gain };
  });
}

function stopMusic(): void {
  if (!music) return;
  music.source.stop();
  music.gain.disconnect();
  music = null;
}

prefsStore.subscribe(() => {
  if (prefsStore.get().music) startMusic();
  else stopMusic();
});

/** Bật / tắt nhạc nền của game (vào game: bật; rời game: tắt). Gọi bật trong thao tác chạm để iOS cho phát. */
export function setMusic(on: boolean): void {
  wanted = on;
  if (on) startMusic();
  else stopMusic();
}
