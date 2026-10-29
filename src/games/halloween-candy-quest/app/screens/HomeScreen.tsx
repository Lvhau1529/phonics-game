/**
 * Màn chào (spec §12 `title`): logo, 3 bạn nhân vật nhún nhảy, PLAY, TEACHER SETUP, âm thanh, Hướng dẫn.
 */
import CharacterSprite from '@/games/halloween-candy-quest/app/components/CharacterSprite';
import { setMusic } from '@/games/halloween-candy-quest/app/audio';
import { candyUrl } from '@/games/halloween-candy-quest/app/assets';
import { halloweenActions } from '@/games/halloween-candy-quest/session/store';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import { SFX } from '@/core/audio/sfx';
import { platformActions } from '@/core/navigation/platformStore';
import { speech } from '@/core/utils/speech';
import AudioToggles from '@/ui/AudioToggles/AudioToggles';
import BackButton from '@/ui/BackButton/BackButton';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import GuideButton from '@/ui/guide/GuideButton/GuideButton';
import styles from '@/games/halloween-candy-quest/app/screens/HomeScreen.module.scss';

const FRIENDS = ['little_ghost', 'pumpkin_kid', 'mini_witch'] as const;
const CANDY = ['lollipop', 'candy_corn', 'pink_wrap', 'star_candy', 'orange_wrap'] as const;

/** Chạm đầu tiên: mở khoá giọng đọc (iOS) + bật nhạc nền */
function unlockAudio(): void {
  speech.unlock();
  setMusic(true);
}

export default function HomeScreen() {
  return (
    <div className={styles.home}>
      <BackButton className={styles.exit} label={TEXT.allGames} onClick={() => platformActions.exitToHub()} />

      <p className={styles.eyebrow}>🎃 {TEXT.eyebrow}</p>
      <h1 className={styles.logo} aria-label={`${TEXT.titleTop} ${TEXT.titleBottom}`}>
        <span className={styles.logoTop} aria-hidden="true">
          {TEXT.titleTop}
        </span>
        <span className={styles.logoBottom} aria-hidden="true">
          {TEXT.titleBottom}
        </span>
      </h1>
      <p className={styles.sub}>{TEXT.sub}</p>

      <div className={styles.friends}>
        {FRIENDS.map((id, index) => (
          <span key={id} className={styles.friend}>
            <CharacterSprite id={id} pose={index === 1 ? 'celebrate' : 'idle'} size={88} />
          </span>
        ))}
      </div>
      <div className={styles.candies} aria-hidden="true">
        {CANDY.map((name) => (
          <img key={name} src={candyUrl(name)} alt="" />
        ))}
      </div>

      <div className={styles.buttons}>
        <Button
          color="orange"
          size="lg"
          className={styles.play}
          sfx={SFX.UI_START}
          onClick={() => {
            unlockAudio();
            halloweenActions.openModes();
          }}
        >
          <Icon name="play" size={26} /> {TEXT.play}
        </Button>
        <Button
          color="purple"
          onClick={() => {
            unlockAudio();
            halloweenActions.openSetup();
          }}
        >
          <Icon name="settings" size={22} /> {TEXT.setupButton}
        </Button>
        <AudioToggles />
        <GuideButton label={TEXT.guide} />
      </div>
    </div>
  );
}
