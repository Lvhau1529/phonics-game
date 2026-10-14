/**
 * Khởi tạo service toàn cục và chờ font sẵn sàng.
 */
import Phaser from 'phaser';
import { SCENES } from '@/games/food-stream/game/core/keys';
import { registerServices } from '@/games/food-stream/game/core/services';
import { loadFonts } from '@/core/phaser/fonts';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  async create(): Promise<void> {
    registerServices(this.game);
    await loadFonts();
    this.scene.start(SCENES.PRELOAD);
  }
}
