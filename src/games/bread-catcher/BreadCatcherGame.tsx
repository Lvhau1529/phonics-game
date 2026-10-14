/**
 * Root của Bread Catcher: game Phaser + các màn React phủ lên trên.
 *
 *   home / setup / results -> màn React (Phaser vẽ nền động phía sau, input game bị khoá)
 *   play / gift            -> chỉ còn game Phaser
 *
 * React và Phaser chỉ nói chuyện qua `appStore` (session/sessionStore.ts).
 */
import { useEffect, type ComponentType } from 'react';
import clsx from 'clsx';
import { useAppState } from '@/games/bread-catcher/app/hooks';
import { BREAD_GUIDE_SECTIONS, GUIDE_TITLE } from '@/games/bread-catcher/app/guide/guideSections';
import HomeScreen from '@/games/bread-catcher/app/screens/HomeScreen';
import ResultsScreen from '@/games/bread-catcher/app/screens/ResultsScreen';
import SetupScreen from '@/games/bread-catcher/app/screens/SetupScreen';
import { createGame } from '@/games/bread-catcher/game/createGame';
import { sessionActions, type Screen } from '@/games/bread-catcher/session/sessionStore';
import PhaserHost from '@/core/phaser/PhaserHost';
import { useGameOrientation } from '@/core/phaser/useGameOrientation';
import GuideDialog from '@/ui/guide/GuideDialog/GuideDialog';
import ScreenLayer from '@/ui/ScreenLayer/ScreenLayer';

const REACT_SCREENS: Partial<Record<Screen, ComponentType>> = {
  home: HomeScreen,
  setup: SetupScreen,
  results: ResultsScreen,
};

export default function BreadCatcherGame() {
  const screen = useAppState((state) => state.screen);
  // Đang chơi dở thì không dựng lại game khi xoay / đổi kích thước màn hình
  const orientation = useGameOrientation(screen === 'play' || screen === 'gift');
  const Overlay = REACT_SCREENS[screen];

  // Rời game (về màn chọn game) -> lần sau vào lại bắt đầu từ Home
  useEffect(() => () => sessionActions.goHome(), []);

  return (
    <main className={clsx('app', `app--${orientation}`)}>
      <PhaserHost key={orientation} create={createGame} inputLocked={Overlay !== undefined} />
      {Overlay && (
        <ScreenLayer key={screen}>
          <Overlay />
        </ScreenLayer>
      )}
      <GuideDialog title={GUIDE_TITLE} sections={BREAD_GUIDE_SECTIONS} />
    </main>
  );
}
