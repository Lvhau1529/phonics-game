/**
 * Service sống suốt vòng đời game (dùng chung giữa các scene), lưu trong `game.registry`.
 */
import Phaser from 'phaser';
import { MUSIC_VOLUME, type MusicKey } from '@/games/food-stream/game/config/assets';
import { REGISTRY } from '@/games/food-stream/game/core/keys';
import AudioSystem from '@/core/phaser/AudioSystem';

export type FoodStreamAudio = AudioSystem<MusicKey>;

export function registerServices(game: Phaser.Game): void {
  if (game.registry.has(REGISTRY.AUDIO)) return;
  const audio: FoodStreamAudio = new AudioSystem(game, MUSIC_VOLUME);
  game.registry.set(REGISTRY.AUDIO, audio);
  game.events.once(Phaser.Core.Events.DESTROY, () => audio.destroy());
}

export const getAudio = (scene: Phaser.Scene): FoodStreamAudio => scene.registry.get(REGISTRY.AUDIO);
