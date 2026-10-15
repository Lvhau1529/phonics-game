/**
 * Điều phối scene theo `appStore.screen` — cầu nối giữa React shell và Phaser.
 *
 *   home / setup / results -> ShellScene (nền động phía sau UI React)
 *   play                   -> TurnPicker (Class) hoặc Game (Solo)
 *   gift                   -> GiftScene
 *
 * Bên trong một phiên, các scene tự chuyển cho nhau (Picker -> Game -> Turn Complete -> Picker...);
 * Director chỉ can thiệp khi đổi màn hoặc bắt đầu phiên mới (Back / End Game / Play Again).
 */
import Phaser from 'phaser';
import { SCENES, type SceneKey } from '@/games/bread-catcher/game/core/keys';
import type ShellScene from '@/games/bread-catcher/game/scenes/ShellScene';
import type { ShellScreen } from '@/games/bread-catcher/game/scenes/ShellScene';
import { appStore } from '@/games/bread-catcher/session/sessionStore';
import { ASSETS_READY } from '@/core/phaser/assetLoading';

/** Các scene có thể bị Director dừng (không gồm Boot / Preload) */
const MANAGED_SCENES: SceneKey[] = [
  SCENES.SHELL,
  SCENES.TURN_PICKER,
  SCENES.GAME,
  SCENES.PAUSE,
  SCENES.TURN_COMPLETE,
  SCENES.GIFT,
];

export function startSceneDirector(game: Phaser.Game): void {
  let ready = false;
  let lastScreen: string | null = null;
  let lastSessionId: number | null = null;

  const stopAllExcept = (keep?: SceneKey) => {
    MANAGED_SCENES.forEach((key) => {
      if (key !== keep && (game.scene.isActive(key) || game.scene.isPaused(key))) game.scene.stop(key);
    });
  };

  const showShell = (screen: ShellScreen) => {
    stopAllExcept(SCENES.SHELL);
    if (game.scene.isActive(SCENES.SHELL)) {
      (game.scene.getScene(SCENES.SHELL) as ShellScene).setScreen(screen);
    } else {
      game.scene.start(SCENES.SHELL, { screen });
    }
  };

  const startOnly = (key: SceneKey) => {
    stopAllExcept();
    game.scene.start(key);
  };

  const sync = () => {
    if (!ready) return;
    const { screen, session } = appStore.get();
    const sessionId = session?.id ?? null;
    if (screen === lastScreen && sessionId === lastSessionId) return;
    lastScreen = screen;
    lastSessionId = sessionId;

    switch (screen) {
      case 'home':
      case 'setup':
      case 'results':
        showShell(screen);
        break;
      case 'play':
        startOnly(session?.settings.mode === 'class' ? SCENES.TURN_PICKER : SCENES.GAME);
        break;
      case 'gift':
        startOnly(SCENES.GIFT);
        break;
    }
  };

  game.events.once(ASSETS_READY, () => {
    ready = true;
    sync();
  });
  const unsubscribe = appStore.subscribe(sync);
  game.events.once(Phaser.Core.Events.DESTROY, unsubscribe);
}
