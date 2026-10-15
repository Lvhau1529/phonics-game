/**
 * Tải toàn bộ ảnh (theo sprites.json), SFX dùng chung và nhạc nền.
 * Tiến độ báo qua core/phaser/assetLoading.ts (PhaserHost hiện thanh tiến độ / màn LOADING).
 */
import Phaser from 'phaser';
import { JINGLE, MUSIC, musicUrls } from '@/games/food-stream/game/config/assets';
import { SCENES } from '@/games/food-stream/game/core/keys';
import { SPRITES } from '@/games/food-stream/game/config/sprites';
import { SFX, sfxUrls } from '@/core/audio/sfx';
import { markAssetsReady, reportLoadProgress } from '@/core/phaser/assetLoading';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    reportLoadProgress(this);
    Object.entries(SPRITES).forEach(([key, info]) => this.load.image(key, info.path));
    Object.values(SFX).forEach((key) => this.load.audio(key, sfxUrls(key)));
    [...Object.values(MUSIC), JINGLE.key].forEach((key) => this.load.audio(key, musicUrls(key)));
  }

  create(): void {
    // Ảnh đã được thu nhỏ sẵn (Lanczos) theo độ phân giải canvas: lọc tuyến tính cho mượt khi co giãn
    Object.keys(SPRITES).forEach((key) =>
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR),
    );
    markAssetsReady(this.game);
    this.scene.stop();
  }
}
