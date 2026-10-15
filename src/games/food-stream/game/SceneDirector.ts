/**
 * Điều phối scene theo `foodStreamStore.screen` — cầu nối giữa màn React và Phaser.
 *
 *   home / setup / results -> StudioScene (phòng stream phía sau UI React)
 *   play                   -> LiveScene (mỗi phiên mới chạy lại từ đầu)
 */
import Phaser from 'phaser';
import { SCENES, type SceneKey } from '@/games/food-stream/game/core/keys';
import type StudioScene from '@/games/food-stream/game/scenes/StudioScene';
import { foodStreamStore } from '@/games/food-stream/session/store';
import { ASSETS_READY } from '@/core/phaser/assetLoading';

const MANAGED_SCENES: SceneKey[] = [SCENES.STUDIO, SCENES.LIVE, SCENES.PAUSE];

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
    const { screen, session } = foodStreamStore.get();
    const sessionId = session?.id ?? null;
    if (screen === lastScreen && sessionId === lastSessionId) return;
    lastScreen = screen;
    lastSessionId = sessionId;

    if (screen === 'play') {
      stopAllExcept();
      game.scene.start(SCENES.LIVE);
      return;
    }
    stopAllExcept(SCENES.STUDIO);
    if (game.scene.isActive(SCENES.STUDIO)) {
      (game.scene.getScene(SCENES.STUDIO) as StudioScene).setScreen(screen);
    } else {
      game.scene.start(SCENES.STUDIO, { screen });
    }
  };

  game.events.once(ASSETS_READY, () => {
    ready = true;
    sync();
  });
  const unsubscribe = foodStreamStore.subscribe(sync);
  game.events.once(Phaser.Core.Events.DESTROY, unsubscribe);
}
