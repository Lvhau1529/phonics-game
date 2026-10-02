/**
 * Tải toàn bộ ảnh (theo sprites.json), SFX dùng chung và nhạc nền.
 * Người chơi thường đang ở màn Home (React) trong lúc này nên không cần màn loading riêng.
 */
import Phaser from 'phaser';
import { JINGLE, MUSIC, musicUrls } from '@/games/food-stream/game/config/assets';
import { ASSETS_READY, SCENES } from '@/games/food-stream/game/core/keys';
import { SPRITES } from '@/games/food-stream/game/config/sprites';
import { SFX, sfxUrls } from '@/platform/audio/sfx';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    Object.entries(SPRITES).forEach(([key, info]) => this.load.image(key, info.path));
    Object.values(SFX).forEach((key) => this.load.audio(key, sfxUrls(key)));
    [...Object.values(MUSIC), JINGLE.key].forEach((key) => this.load.audio(key, musicUrls(key)));
  }

  create(): void {
    // Ảnh đã được thu nhỏ sẵn (Lanczos) theo độ phân giải canvas: lọc tuyến tính cho mượt khi co giãn
    Object.keys(SPRITES).forEach((key) =>
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR),
    );
    this.game.events.emit(ASSETS_READY);
    this.scene.stop();
  }
}
