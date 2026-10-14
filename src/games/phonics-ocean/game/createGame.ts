/**
 * Tạo instance Phaser.Game của Phonics Ocean. Được gọi từ React (<PhaserHost create={createGame} />).
 */
import type Phaser from 'phaser';
import { THEME } from '@/games/phonics-ocean/game/config/theme';
import { startSceneDirector } from '@/games/phonics-ocean/game/SceneDirector';
import BootScene from '@/games/phonics-ocean/game/scenes/BootScene';
import LobbyScene from '@/games/phonics-ocean/game/scenes/LobbyScene';
import OceanScene from '@/games/phonics-ocean/game/scenes/OceanScene';
import PauseScene from '@/games/phonics-ocean/game/scenes/PauseScene';
import PreloadScene from '@/games/phonics-ocean/game/scenes/PreloadScene';
import { phonicsOceanActions, phonicsOceanStore } from '@/games/phonics-ocean/session/store';
import { createPhaserGame } from '@/core/phaser/createPhaserGame';

export function createGame(parent: HTMLElement): Phaser.Game {
  const game = createPhaserGame(parent, {
    backgroundColor: THEME.backgroundColor,
    // Thứ tự = thứ tự vẽ: Pause nằm trên OceanScene
    scene: [BootScene, PreloadScene, LobbyScene, OceanScene, PauseScene],
  });

  startSceneDirector(game);

  // Chỉ ở dev: truy cập game + phiên chơi từ DevTools để debug
  if (import.meta.env.DEV)
    Object.assign(window, { __PHONICS_OCEAN__: { game, phonicsOceanStore, phonicsOceanActions } });

  return game;
}
