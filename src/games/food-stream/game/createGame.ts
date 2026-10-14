/**
 * Tạo instance Phaser.Game của Food Stream. Được gọi từ React (<PhaserHost create={createGame} />).
 */
import type Phaser from 'phaser';
import { THEME } from '@/games/food-stream/game/config/theme';
import { startSceneDirector } from '@/games/food-stream/game/SceneDirector';
import BootScene from '@/games/food-stream/game/scenes/BootScene';
import LiveScene from '@/games/food-stream/game/scenes/LiveScene';
import PauseScene from '@/games/food-stream/game/scenes/PauseScene';
import PreloadScene from '@/games/food-stream/game/scenes/PreloadScene';
import StudioScene from '@/games/food-stream/game/scenes/StudioScene';
import { foodStreamActions, foodStreamStore } from '@/games/food-stream/session/store';
import { createPhaserGame } from '@/core/phaser/createPhaserGame';

export function createGame(parent: HTMLElement): Phaser.Game {
  const game = createPhaserGame(parent, {
    backgroundColor: THEME.backgroundColor,
    // Thứ tự = thứ tự vẽ: Pause nằm trên LiveScene
    scene: [BootScene, PreloadScene, StudioScene, LiveScene, PauseScene],
  });

  startSceneDirector(game);

  // Chỉ ở dev: truy cập game + phiên chơi từ DevTools để debug
  if (import.meta.env.DEV)
    Object.assign(window, { __FOOD_STREAM__: { game, foodStreamStore, foodStreamActions } });

  return game;
}
