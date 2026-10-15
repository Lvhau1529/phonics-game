/**
 * Màn chính: logo "SPEAKING ADVENTURE · ODD ONE OUT!", hai bé thám hiểm, PLAY, LEADERBOARD,
 * bật / tắt âm thanh, Hướng dẫn, quay về màn chọn game.
 */
import { ART } from '@/games/odd-one-out/app/assets';
import { oddOneOutActions } from '@/games/odd-one-out/session/store';
import { TEXT } from '@/games/odd-one-out/session/text';
import { SFX } from '@/core/audio/sfx';
import { platformActions } from '@/core/navigation/platformStore';
import { speech } from '@/core/utils/speech';
import AudioToggles from '@/ui/AudioToggles/AudioToggles';
import BackButton from '@/ui/BackButton/BackButton';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import GuideButton from '@/ui/guide/GuideButton/GuideButton';
import styles from '@/games/odd-one-out/app/screens/HomeScreen.module.scss';

export default function HomeScreen() {
  return (
    <div className={styles.home}>
      <BackButton className={styles.exit} label={TEXT.allGames} onClick={() => platformActions.exitToHub()} />

      <div className={styles.hero}>
        <img className={styles.kidLeft} src={ART.boyDog} alt="" />
        <h1 className={styles.logo} aria-label={`${TEXT.titleTop} ${TEXT.titleSign}`}>
          <span className={styles.logoTop} aria-hidden="true">
            {TEXT.titleTop}
          </span>
          <span className={styles.sign} aria-hidden="true">
            {TEXT.titleSign}
          </span>
        </h1>
        <img className={styles.kidRight} src={ART.girlMap} alt="" />
      </div>

      <p className={styles.cues}>{TEXT.tagline}</p>

      <div className={styles.buttons}>
        <Button
          color="pink"
          size="lg"
          className={styles.play}
          sfx={SFX.UI_START}
          onClick={() => {
            speech.unlock(); // iOS: giọng đọc chỉ bật được trong thao tác chạm
            oddOneOutActions.openSetup();
          }}
        >
          <Icon name="play" size={26} /> {TEXT.play}
        </Button>
        <Button color="purple" onClick={() => oddOneOutActions.openLeaderboard()}>
          <Icon name="trophy" size={24} /> {TEXT.leaderboard}
        </Button>
        <AudioToggles />
        <GuideButton label={TEXT.guide} />
      </div>
    </div>
  );
}
