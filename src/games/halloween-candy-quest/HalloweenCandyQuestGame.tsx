/**
 * Root của Halloween Candy Quest — game chỉ có màn React (không cần Phaser): sân khấu pixel-art 320×180 vẽ bằng
 * DOM (nền + nhà + cửa + nhân vật), thử thách từ vựng phủ lên trên bản đồ (spec §12).
 *
 *   home / mode / setup / vocab / characters / picker / play / results -> session/store.ts
 */
import { useEffect, type ComponentType } from 'react';
import clsx from 'clsx';
import { useHalloween } from '@/games/halloween-candy-quest/app/hooks';
import { preloadGameSfx, setMusic } from '@/games/halloween-candy-quest/app/audio';
import { GUIDE_SECTIONS, GUIDE_TITLE } from '@/games/halloween-candy-quest/app/guide/guideSections';
import CharacterScreen from '@/games/halloween-candy-quest/app/screens/CharacterScreen';
import HomeScreen from '@/games/halloween-candy-quest/app/screens/HomeScreen';
import ModeScreen from '@/games/halloween-candy-quest/app/screens/ModeScreen';
import PickerScreen from '@/games/halloween-candy-quest/app/screens/PickerScreen';
import PlayScreen from '@/games/halloween-candy-quest/app/screens/PlayScreen';
import ResultsScreen from '@/games/halloween-candy-quest/app/screens/ResultsScreen';
import SetupScreen from '@/games/halloween-candy-quest/app/screens/SetupScreen';
import VocabScreen from '@/games/halloween-candy-quest/app/screens/VocabScreen';
import { halloweenActions, type Screen } from '@/games/halloween-candy-quest/session/store';
import { useGameOrientation } from '@/core/phaser/useGameOrientation';
import { speech } from '@/core/utils/speech';
import GuideDialog from '@/ui/guide/GuideDialog/GuideDialog';
import ScreenLayer from '@/ui/ScreenLayer/ScreenLayer';
import styles from '@/games/halloween-candy-quest/HalloweenCandyQuestGame.module.scss';

const SCREENS: Record<Screen, ComponentType> = {
  home: HomeScreen,
  mode: ModeScreen,
  setup: SetupScreen,
  vocab: VocabScreen,
  characters: CharacterScreen,
  picker: PickerScreen,
  play: PlayScreen,
  results: ResultsScreen,
};

export default function HalloweenCandyQuestGame() {
  const screen = useHalloween((state) => state.screen);
  // Đang chơi thì giữ bố cục cũ khi xoay màn hình (sân khấu tự co giãn theo khung)
  const orientation = useGameOrientation(screen === 'play');
  const Current = SCREENS[screen];

  useEffect(() => {
    preloadGameSfx();
    // Rời game (về màn chọn game) -> tắt nhạc, máy thôi đọc, lần sau vào lại bắt đầu từ Home
    return () => {
      setMusic(false);
      speech.cancel();
      halloweenActions.goHome();
    };
  }, []);

  return (
    <main className={clsx('app', `app--${orientation}`, styles.theme)}>
      <div className={styles.scenery} aria-hidden="true" />
      <ScreenLayer key={screen}>
        <Current />
      </ScreenLayer>
      <GuideDialog title={GUIDE_TITLE} sections={GUIDE_SECTIONS} />
    </main>
  );
}
