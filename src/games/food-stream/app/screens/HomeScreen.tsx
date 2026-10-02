/**
 * Main menu (plan §4.1): PLAY vào Setup, bật / tắt âm thanh, Hướng dẫn, quay về màn chọn game.
 * Trẻ không cần đọc: nút PLAY to; hai streamer ngồi chờ ở phòng stream phía sau (StudioScene).
 */
import { foodStreamActions } from '@/games/food-stream/session/store';
import { TEXT } from '@/games/food-stream/session/text';
import { SFX } from '@/platform/audio/sfx';
import { platformActions } from '@/platform/platformStore';
import AudioToggles from '@/platform/ui/AudioToggles';
import BackButton from '@/platform/ui/BackButton';
import Button from '@/platform/ui/Button';
import Icon from '@/platform/ui/Icon';
import GuideButton from '@/platform/ui/guide/GuideButton';
import styles from '@/games/food-stream/app/screens/HomeScreen.module.scss';

export default function HomeScreen() {
  return (
    <div className={styles.home}>
      <BackButton className={styles.exit} label={TEXT.allGames} onClick={() => platformActions.exitToHub()} />

      <h1 className={styles.logo} aria-label={`${TEXT.titleTop} ${TEXT.titleBottom}`}>
        <span className={styles.live} aria-hidden="true">
          ● LIVE
        </span>
        <span className={styles.logoTop} aria-hidden="true">
          {TEXT.titleTop}
        </span>
        <span className={styles.logoBottom} aria-hidden="true">
          {TEXT.titleBottom}
        </span>
      </h1>

      <Button
        color="pink"
        size="lg"
        className={styles.play}
        sfx={SFX.UI_START}
        onClick={() => foodStreamActions.openSetup()}
      >
        <Icon name="play" size={26} /> {TEXT.play}
      </Button>

      <AudioToggles className={styles.toggles} />
      <GuideButton label={TEXT.guide} className={styles.guide} />
    </div>
  );
}
