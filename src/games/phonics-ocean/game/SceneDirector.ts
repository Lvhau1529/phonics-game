/**
 * Điều phối scene theo `phonicsOceanStore.screen` — cầu nối giữa màn React và Phaser.
 *
 *   home / setup / results -> LobbyScene (đại dương phía sau UI React)
 *   play                   -> OceanScene (mỗi phiên mới chạy lại từ đầu)
 */
import Phaser from 'phaser';
import { SCENES, type SceneKey } from '@/games/phonics-ocean/game/core/keys';
import type LobbyScene from '@/games/phonics-ocean/game/scenes/LobbyScene';
import { phonicsOceanStore } from '@/games/phonics-ocean/session/store';
import { ASSETS_READY } from '@/core/phaser/assetLoading';

const MANAGED_SCENES: SceneKey[] = [SCENES.LOBBY, SCENES.OCEAN, SCENES.PAUSE];

export function startSceneDirector(game: Phaser.Game): void {
  let ready = false;
  let lastScreen: string | null = null;
  let lastSessionId: number | null = null;

  const stopAllExcept = (keep?: SceneKey) => {
    MANAGED_SCENES.forEach((key) => {
      if (key !== keep && (game.scene.isActive(key) || game.scene.isPaused(key))) game.scene.stop(key);
    });
  };

  const sync = () => {
    if (!ready) return;
    const { screen, session } = phonicsOceanStore.get();
    const sessionId = session?.id ?? null;
    if (screen === lastScreen && sessionId === lastSessionId) return;
    lastScreen = screen;
    lastSessionId = sessionId;

    if (screen === 'play') {
      stopAllExcept();
      game.scene.start(SCENES.OCEAN);
      return;
    }
    stopAllExcept(SCENES.LOBBY);
    if (game.scene.isActive(SCENES.LOBBY)) {
      (game.scene.getScene(SCENES.LOBBY) as LobbyScene).setScreen(screen);
    } else {
      game.scene.start(SCENES.LOBBY, { screen });
    }
  };

  game.events.once(ASSETS_READY, () => {
    ready = true;
    sync();
  });
  const unsubscribe = phonicsOceanStore.subscribe(sync);
  game.events.once(Phaser.Core.Events.DESTROY, unsubscribe);
}
