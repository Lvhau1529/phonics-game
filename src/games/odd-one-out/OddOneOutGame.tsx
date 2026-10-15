/**
 * Root của Odd One Out — game chỉ có màn React (không cần Phaser): nhìn 4 hình, chọn hình khác loại,
 * nói lý do bằng tiếng Anh, nghe câu mẫu. Cảnh trời / cỏ vẽ bằng CSS phía sau các màn.
 *
 *   home / setup / play / results / leaderboard -> session/store.ts
 */
import { useEffect, type ComponentType } from 'react';
import clsx from 'clsx';
import { useOddOneOut } from '@/games/odd-one-out/app/hooks';
import { GUIDE_TITLE, ODD_ONE_OUT_GUIDE_SECTIONS } from '@/games/odd-one-out/app/guide/guideSections';
import HomeScreen from '@/games/odd-one-out/app/screens/HomeScreen';
import LeaderboardScreen from '@/games/odd-one-out/app/screens/LeaderboardScreen';
import PlayScreen from '@/games/odd-one-out/app/screens/PlayScreen';
import ResultsScreen from '@/games/odd-one-out/app/screens/ResultsScreen';
import SetupScreen from '@/games/odd-one-out/app/screens/SetupScreen';
import { oddOneOutActions, type Screen } from '@/games/odd-one-out/session/store';
import { useGameOrientation } from '@/core/phaser/useGameOrientation';
import { speech } from '@/core/utils/speech';
import GuideDialog from '@/ui/guide/GuideDialog/GuideDialog';
import ScreenLayer from '@/ui/ScreenLayer/ScreenLayer';
import styles from '@/games/odd-one-out/OddOneOutGame.module.scss';

const SCREENS: Record<Screen, ComponentType> = {
  home: HomeScreen,
  setup: SetupScreen,
  play: PlayScreen,
  results: ResultsScreen,
  leaderboard: LeaderboardScreen,
};

export default function OddOneOutGame() {
  const screen = useOddOneOut((state) => state.screen);
  // Đang làm câu đố thì giữ bố cục cũ khi xoay màn hình
  const orientation = useGameOrientation(screen === 'play');
  const Current = SCREENS[screen];

  // Rời game (về màn chọn game) -> lần sau vào lại bắt đầu từ Home, máy thôi đọc
  useEffect(
    () => () => {
      speech.cancel();
      oddOneOutActions.goHome();
    },
    [],
  );

  return (
    <main className={clsx('app', `app--${orientation}`, styles.theme)}>
      <div className={styles.scenery} aria-hidden="true" />
      <ScreenLayer key={screen}>
        <Current />
      </ScreenLayer>
      <GuideDialog title={GUIDE_TITLE} sections={ODD_ONE_OUT_GUIDE_SECTIONS} />
    </main>
  );
}
