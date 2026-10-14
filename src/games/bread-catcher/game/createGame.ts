/**
 * Tạo instance Phaser.Game của Bread Catcher. Được gọi từ React (<PhaserHost create={createGame} />).
 */
import type Phaser from 'phaser';
import { THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { startSceneDirector } from '@/games/bread-catcher/game/SceneDirector';
import BootScene from '@/games/bread-catcher/game/scenes/BootScene';
import GameScene from '@/games/bread-catcher/game/scenes/GameScene';
import GiftScene from '@/games/bread-catcher/game/scenes/GiftScene';
import PauseScene from '@/games/bread-catcher/game/scenes/PauseScene';
import PreloadScene from '@/games/bread-catcher/game/scenes/PreloadScene';
import ShellScene from '@/games/bread-catcher/game/scenes/ShellScene';
import TurnCompleteScene from '@/games/bread-catcher/game/scenes/TurnCompleteScene';
import TurnPickerScene from '@/games/bread-catcher/game/scenes/TurnPickerScene';
import { appStore, sessionActions } from '@/games/bread-catcher/session/sessionStore';
import { createPhaserGame } from '@/core/phaser/createPhaserGame';

export function createGame(parent: HTMLElement): Phaser.Game {
  const game = createPhaserGame(parent, {
    backgroundColor: THEME.backgroundColor,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    // Thứ tự = thứ tự vẽ: overlay (Pause, Turn Complete) nằm trên GameScene
    scene: [
      BootScene,
      PreloadScene,
      ShellScene,
      TurnPickerScene,
      GameScene,
      GiftScene,
      TurnCompleteScene,
      PauseScene,
    ],
  });

  startSceneDirector(game);

  // Chỉ ở dev: truy cập game + phiên chơi từ DevTools để debug
  if (import.meta.env.DEV)
    Object.assign(window, { __GAME__: game, __SESSION__: { appStore, sessionActions } });

  return game;
}
