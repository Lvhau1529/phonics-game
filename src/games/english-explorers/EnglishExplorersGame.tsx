/**
 * Root của Little English Explorers — game chỉ có màn React (không cần Phaser): nhìn tranh, nghe câu hỏi,
 * chọn đáp án, nói cả câu tiếng Anh. Trời / cỏ vẽ bằng CSS phía sau các màn.
 *
 *   home / setup / play / results -> session/store.ts
 */
import { useEffect, type ComponentType } from 'react';
import clsx from 'clsx';
import { useExplorers } from '@/games/english-explorers/app/hooks';
import { EXPLORERS_GUIDE_SECTIONS, GUIDE_TITLE } from '@/games/english-explorers/app/guide/guideSections';
import HomeScreen from '@/games/english-explorers/app/screens/HomeScreen';
import PlayScreen from '@/games/english-explorers/app/screens/PlayScreen';
import ResultsScreen from '@/games/english-explorers/app/screens/ResultsScreen';
import SetupScreen from '@/games/english-explorers/app/screens/SetupScreen';
import { englishExplorersActions, type Screen } from '@/games/english-explorers/session/store';
import { useGameOrientation } from '@/core/phaser/useGameOrientation';
import { speech } from '@/core/utils/speech';
import GuideDialog from '@/ui/guide/GuideDialog/GuideDialog';
import ScreenLayer from '@/ui/ScreenLayer/ScreenLayer';
import styles from '@/games/english-explorers/EnglishExplorersGame.module.scss';

const SCREENS: Record<Screen, ComponentType> = {
  home: HomeScreen,
  setup: SetupScreen,
  play: PlayScreen,
  results: ResultsScreen,
};

export default function EnglishExplorersGame() {
  const screen = useExplorers((state) => state.screen);
  // Đang chơi thì giữ bố cục cũ khi xoay màn hình
  const orientation = useGameOrientation(screen === 'play');
  const Current = SCREENS[screen];

  // Rời game (về màn chọn game) -> lần sau vào lại bắt đầu từ Home, máy thôi đọc
  useEffect(
    () => () => {
      speech.cancel();
      englishExplorersActions.goHome();
    },
    [],
  );

  return (
    <main className={clsx('app', `app--${orientation}`, styles.theme)}>
      <div className={styles.scenery} aria-hidden="true" />
      <ScreenLayer key={screen}>
        <Current />
      </ScreenLayer>
      <GuideDialog title={GUIDE_TITLE} sections={EXPLORERS_GUIDE_SECTIONS} />
    </main>
  );
}
