/**
 * Cấu hình Phaser chung cho mọi game: kích thước logic theo hướng màn hình (viewport.ts),
 * canvas render gấp RENDER_SCALE, pixel-art, dùng chung AudioContext của app.
 * Game chỉ cần truyền scene, màu nền và (nếu cần) physics.
 */
import Phaser from 'phaser';
import { getAudioContext } from '@/core/audio/audioContext';
import { computeGameSize, RENDER_SCALE } from '@/core/phaser/viewport';

export type PhaserGameOptions = Pick<Phaser.Types.Core.GameConfig, 'scene' | 'backgroundColor' | 'physics'>;

export function createPhaserGame(parent: HTMLElement, options: PhaserGameOptions): Phaser.Game {
  const size = computeGameSize();
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    // Canvas lớn gấp RENDER_SCALE lần toạ độ logic (xem view.ts)
    width: size.width * RENDER_SCALE,
    height: size.height * RENDER_SCALE,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: { activePointers: 2 },
    audio: { context: getAudioContext() },
    ...options,
  });
}
