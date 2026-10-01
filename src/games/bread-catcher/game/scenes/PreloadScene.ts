/**
 * Tải toàn bộ hình ảnh (theo sprites.json + atlas tranh từ vựng), SFX và nhạc nền.
 * Người chơi thường đang ở màn Home (React) trong lúc này nên không cần màn loading riêng.
 */
import Phaser from 'phaser';
import {
  MUSIC,
  SPRITE_MANIFEST,
  WORD_ATLAS,
  musicUrls,
  type SpriteManifest,
} from '@/games/bread-catcher/game/config/assets';
import { SCENES } from '@/games/bread-catcher/game/core/keys';
import { isLandscape } from '@/platform/phaser/view';
import { registerBrainrotAnims } from '@/games/bread-catcher/game/objects/brainrot';
import { SFX, sfxUrls } from '@/platform/audio/sfx';

/** Game phát event này khi asset đã sẵn sàng (SceneDirector bắt đầu điều phối) */
export const ASSETS_READY = 'assets-ready';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    const manifest = this.cache.json.get(SPRITE_MANIFEST.key) as SpriteManifest;
    // Ảnh nền chỉ tải bộ đúng hướng màn hình (bản dọc hoặc bản ngang "_wide")
    const landscape = isLandscape(this);
    const needed = ([key]: [string, unknown]) => {
      if (key.endsWith('_wide')) return landscape;
      return !(landscape && `${key}_wide` in manifest);
    };
    Object.entries(manifest)
      .filter(needed)
      .forEach(([key, info]) => this.load.image(key, info.path));
    this.load.atlas(WORD_ATLAS.key, WORD_ATLAS.textureUrl, WORD_ATLAS.atlasUrl);
    Object.values(SFX).forEach((key) => this.load.audio(key, sfxUrls(key)));
    Object.values(MUSIC).forEach((key) => this.load.audio(key, musicUrls(key)));
  }

  create(): void {
    registerBrainrotAnims(this.anims);
    this.game.events.emit(ASSETS_READY);
    this.scene.stop();
  }
}
