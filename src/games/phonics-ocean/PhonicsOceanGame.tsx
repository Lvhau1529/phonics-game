/**
 * Root của Phonics Ocean: game Phaser + các màn React phủ lên trên.
 *
 *   home / setup / results -> màn React (Phaser vẽ đại dương phía sau, input game bị khoá)
 *   play                   -> chỉ còn game Phaser
 *
 * React và Phaser chỉ nói chuyện qua `phonicsOceanStore` (session/store.ts).
 */
import { useEffect, type ComponentType } from 'react';
import clsx from 'clsx';
import { GUIDE_TITLE, PHONICS_OCEAN_GUIDE_SECTIONS } from '@/games/phonics-ocean/app/guide/guideSections';
import { usePhonicsOcean } from '@/games/phonics-ocean/app/hooks';
import HomeScreen from '@/games/phonics-ocean/app/screens/HomeScreen';
import ResultsScreen from '@/games/phonics-ocean/app/screens/ResultsScreen';
import SetupScreen from '@/games/phonics-ocean/app/screens/SetupScreen';
import { createGame } from '@/games/phonics-ocean/game/createGame';
import { phonicsOceanActions, type Screen } from '@/games/phonics-ocean/session/store';
import PhaserHost from '@/core/phaser/PhaserHost';
import { useGameOrientation } from '@/core/phaser/useGameOrientation';
import GuideDialog from '@/ui/guide/GuideDialog/GuideDialog';
import ScreenLayer from '@/ui/ScreenLayer/ScreenLayer';
import styles from '@/games/phonics-ocean/PhonicsOceanGame.module.scss';

const REACT_SCREENS: Partial<Record<Screen, ComponentType>> = {
  home: HomeScreen,
  setup: SetupScreen,
  results: ResultsScreen,
};

export default function PhonicsOceanGame() {
  const screen = usePhonicsOcean((state) => state.screen);
  // Đang chơi dở thì không dựng lại game khi xoay / đổi kích thước màn hình
  const orientation = useGameOrientation(screen === 'play');
  const Overlay = REACT_SCREENS[screen];

  // Rời game (về màn chọn game) -> lần sau vào lại bắt đầu từ Home
  useEffect(() => () => phonicsOceanActions.goHome(), []);

  return (
    <main className={clsx('app', `app--${orientation}`, styles.theme)}>
      <PhaserHost key={orientation} create={createGame} inputLocked={Overlay !== undefined} />
      {Overlay && (
        <ScreenLayer key={screen}>
          <Overlay />
        </ScreenLayer>
      )}
      <GuideDialog title={GUIDE_TITLE} sections={PHONICS_OCEAN_GUIDE_SECTIONS} />
    </main>
  );
}
