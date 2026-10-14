/**
 * Phát SFX dùng chung từ các màn React (nút bấm, lựa chọn, bảng xếp hạng...) — không cần game
 * Phaser nào đang chạy (vd: màn chọn game). Tôn trọng cài đặt SOUND trong prefsStore.
 */
import { getAudioContext, resumeAudio } from '@/core/audio/audioContext';
import { SFX_VOLUME, sfxUrls, type SfxKey } from '@/core/audio/sfx';
import { prefsStore } from '@/core/audio/prefs';

const buffers = new Map<SfxKey, Promise<AudioBuffer | null>>();

function pickUrl(key: SfxKey): string {
  const [ogg, mp3] = sfxUrls(key);
  return new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? ogg : mp3;
}

function load(ctx: AudioContext, key: SfxKey): Promise<AudioBuffer | null> {
  let buffer = buffers.get(key);
  if (!buffer) {
    buffer = fetch(pickUrl(key))
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => null);
    buffers.set(key, buffer);
  }
  return buffer;
}

export function playSfx(key: SfxKey): void {
  const ctx = getAudioContext();
  if (!ctx || !prefsStore.get().sfx) return;
  resumeAudio();
  void load(ctx, key).then((buffer) => {
    if (!buffer) return;
    const gain = ctx.createGain();
    gain.gain.value = SFX_VOLUME[key];
    gain.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start();
  });
}

/** Tải sẵn để lần bấm đầu tiên không bị trễ */
export function preloadSfx(keys: readonly SfxKey[]): void {
  const ctx = getAudioContext();
  if (ctx) keys.forEach((key) => void load(ctx, key));
}
