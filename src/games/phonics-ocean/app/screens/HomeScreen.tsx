/**
 * Main menu: PLAY vào Setup, bật / tắt âm thanh, Hướng dẫn, quay về màn chọn game.
 * Trẻ không cần đọc: nút PLAY to; cá của bé bơi lượn ở đại dương phía sau (LobbyScene).
 */
import { phonicsOceanActions } from '@/games/phonics-ocean/session/store';
import { TEXT } from '@/games/phonics-ocean/session/text';
import { SFX } from '@/core/audio/sfx';
import { platformActions } from '@/app/stores/platformStore';
import AudioToggles from '@/ui/AudioToggles/AudioToggles';
import BackButton from '@/ui/BackButton/BackButton';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import GuideButton from '@/ui/guide/GuideButton/GuideButton';
import styles from '@/games/phonics-ocean/app/screens/HomeScreen.module.scss';

export default function HomeScreen() {
  return (
    <div className={styles.home}>
      <BackButton className={styles.exit} label={TEXT.allGames} onClick={() => platformActions.exitToHub()} />

      <h1 className={styles.logo} aria-label={`${TEXT.titleTop} ${TEXT.titleBottom}`}>
        <span className={styles.logoTop} aria-hidden="true">
          {TEXT.titleTop}
        </span>
        <span className={styles.logoBottom} aria-hidden="true">
          {TEXT.titleBottom}
        </span>
        <span className={styles.tagline} aria-hidden="true">
          {TEXT.tagline}
        </span>
      </h1>

      <Button
        color="green"
        size="lg"
        className={styles.play}
        sfx={SFX.UI_START}
        onClick={() => phonicsOceanActions.openSetup()}
      >
        <Icon name="play" size={26} /> {TEXT.play}
      </Button>

      <AudioToggles className={styles.toggles} />
      <GuideButton label={TEXT.guide} className={styles.guide} />
    </div>
  );
}
