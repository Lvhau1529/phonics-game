/**
 * Tiến độ tải asset của một game Phaser, báo qua `game.events` (dùng chung cho mọi game):
 *   - PreloadScene gọi `reportLoadProgress(this)` trong `preload()` và `markAssetsReady(this.game)` khi xong
 *   - SceneDirector chờ ASSETS_READY mới điều phối scene
 *   - PhaserHost (React) nghe cả hai để hiện màn chờ / thanh tiến độ — bé bấm START khi ảnh chưa tải xong
 *     thì thấy LOADING thay vì màn trống (tưởng nút không ăn)
 */
import Phaser from 'phaser';

/** Asset đã sẵn sàng (SceneDirector bắt đầu điều phối) */
export const ASSETS_READY = 'assets-ready';
/** Tiến độ tải 0–1 */
export const ASSETS_PROGRESS = 'assets-progress';

export function reportLoadProgress(scene: Phaser.Scene): void {
  scene.load.on(Phaser.Loader.Events.PROGRESS, (value: number) =>
    scene.game.events.emit(ASSETS_PROGRESS, value),
  );
}

export function markAssetsReady(game: Phaser.Game): void {
  game.events.emit(ASSETS_READY);
}
