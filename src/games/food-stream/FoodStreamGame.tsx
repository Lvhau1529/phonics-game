/**
 * Root của Food Stream: game Phaser + các màn React phủ lên trên.
 *
 *   home / setup / results -> màn React (Phaser vẽ phòng stream phía sau, input game bị khoá)
 *   play                   -> chỉ còn game Phaser
 *
 * React và Phaser chỉ nói chuyện qua `foodStreamStore` (session/store.ts).
 */
import { useEffect, type ComponentType } from 'react';
import clsx from 'clsx';
import { FOOD_STREAM_GUIDE_SECTIONS, GUIDE_TITLE } from '@/games/food-stream/app/guide/guideSections';
import { useFoodStream } from '@/games/food-stream/app/hooks';
import HomeScreen from '@/games/food-stream/app/screens/HomeScreen';
import ResultsScreen from '@/games/food-stream/app/screens/ResultsScreen';
import SetupScreen from '@/games/food-stream/app/screens/SetupScreen';
import { createGame } from '@/games/food-stream/game/createGame';
import { foodStreamActions, type Screen } from '@/games/food-stream/session/store';
import PhaserHost from '@/platform/phaser/PhaserHost';
import { useGameOrientation } from '@/platform/phaser/useGameOrientation';
import GuideDialog from '@/platform/ui/guide/GuideDialog';
import ScreenLayer from '@/platform/ui/ScreenLayer';
import styles from '@/games/food-stream/FoodStreamGame.module.scss';

const REACT_SCREENS: Partial<Record<Screen, ComponentType>> = {
  home: HomeScreen,
  setup: SetupScreen,
  results: ResultsScreen,
};

export default function FoodStreamGame() {
  const screen = useFoodStream((state) => state.screen);
  // Đang chơi dở thì không dựng lại game khi xoay / đổi kích thước màn hình
  const orientation = useGameOrientation(screen === 'play');
  const Overlay = REACT_SCREENS[screen];

  // Rời game (về màn chọn game) -> lần sau vào lại bắt đầu từ Home
  useEffect(() => () => foodStreamActions.goHome(), []);

  return (
    <main className={clsx('app', `app--${orientation}`, styles.theme)}>
      <PhaserHost key={orientation} create={createGame} inputLocked={Overlay !== undefined} />
      {Overlay && (
        <ScreenLayer key={screen}>
          <Overlay />
        </ScreenLayer>
      )}
      <GuideDialog title={GUIDE_TITLE} sections={FOOD_STREAM_GUIDE_SECTIONS} />
    </main>
  );
}
