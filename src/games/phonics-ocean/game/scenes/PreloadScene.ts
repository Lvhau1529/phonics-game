/**
 * Tải toàn bộ ảnh (theo sprites.json), SFX (chung + riêng của pack) và nhạc nền; vẽ texture hiệu ứng.
 * Người chơi thường đang ở màn Home (React) trong lúc này nên không cần màn loading riêng.
 */
import Phaser from 'phaser';
import { JINGLE, MUSIC, musicUrls, OCEAN_SFX, oceanSfxUrls } from '@/games/phonics-ocean/game/config/assets';
import { SPRITES } from '@/games/phonics-ocean/game/config/sprites';
import { ASSETS_READY, SCENES } from '@/games/phonics-ocean/game/core/keys';
import { createFxTextures } from '@/games/phonics-ocean/game/systems/textures';
import { SFX, sfxUrls } from '@/core/audio/sfx';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    Object.entries(SPRITES).forEach(([key, info]) => this.load.image(key, info.path));
    Object.values(SFX).forEach((key) => this.load.audio(key, sfxUrls(key)));
    Object.values(OCEAN_SFX).forEach((key) => this.load.audio(key, oceanSfxUrls(key)));
    [...Object.values(MUSIC), JINGLE.key].forEach((key) => this.load.audio(key, musicUrls(key)));
  }

  create(): void {
    // Ảnh đã thu nhỏ sẵn (Lanczos) theo độ phân giải canvas: lọc tuyến tính cho mượt khi co giãn
    Object.keys(SPRITES).forEach((key) =>
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR),
    );
    createFxTextures(this);
    this.game.events.emit(ASSETS_READY);
    this.scene.stop();
  }
}
