/**
 * Khởi tạo service toàn cục, chờ font sẵn sàng và tải manifest sprite.
 */
import Phaser from 'phaser';
import { SPRITE_MANIFEST } from '@/games/bread-catcher/game/config/assets';
import { SCENES } from '@/games/bread-catcher/game/core/keys';
import { registerServices } from '@/games/bread-catcher/game/core/services';
import { loadFonts } from '@/core/phaser/fonts';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload(): void {
    this.load.json(SPRITE_MANIFEST.key, SPRITE_MANIFEST.url);
  }

  async create(): Promise<void> {
    registerServices(this.game);
    await loadFonts();
    this.scene.start(SCENES.PRELOAD);
  }
}
