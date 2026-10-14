/**
 * Service sống suốt vòng đời game (dùng chung giữa các scene), lưu trong `game.registry`.
 */
import Phaser from 'phaser';
import {
  MUSIC_VOLUME,
  OCEAN_SFX_VOLUME,
  type MusicKey,
  type OceanSfxKey,
} from '@/games/phonics-ocean/game/config/assets';
import { REGISTRY } from '@/games/phonics-ocean/game/core/keys';
import AudioSystem from '@/core/phaser/AudioSystem';
import { prefsStore } from '@/core/audio/prefs';

export type OceanAudio = AudioSystem<MusicKey>;

export function registerServices(game: Phaser.Game): void {
  if (game.registry.has(REGISTRY.AUDIO)) return;
  const audio: OceanAudio = new AudioSystem(game, MUSIC_VOLUME);
  game.registry.set(REGISTRY.AUDIO, audio);
  game.events.once(Phaser.Core.Events.DESTROY, () => audio.destroy());
}

export const getAudio = (scene: Phaser.Scene): OceanAudio => scene.registry.get(REGISTRY.AUDIO);

/** SFX riêng của Phonics Ocean (AudioSystem chỉ biết thư viện SFX chung), theo cài đặt SOUND chung */
export function playOceanSfx(scene: Phaser.Scene, key: OceanSfxKey, { rate = 1 } = {}): void {
  if (!prefsStore.get().sfx || !scene.cache.audio.exists(key)) return;
  scene.sound.play(key, { volume: OCEAN_SFX_VOLUME[key], rate });
}
