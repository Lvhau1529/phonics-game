/**
 * Màn chào: "THE MAGIC ANIMAL ADVENTURE · LITTLE ENGLISH EXPLORERS", ba bạn thú, PLAY, âm thanh, Hướng dẫn.
 * Tên bé nhập ở màn chọn thế giới (bản gốc: Esc ở đây nhảy thẳng vào chọn thế giới, bỏ qua tên).
 */
import Picture from '@/games/english-explorers/app/components/Picture';
import { englishExplorersActions } from '@/games/english-explorers/session/store';
import { TEXT } from '@/games/english-explorers/session/text';
import { SFX } from '@/core/audio/sfx';
import { platformActions } from '@/core/navigation/platformStore';
import { speech } from '@/core/utils/speech';
import AudioToggles from '@/ui/AudioToggles/AudioToggles';
import BackButton from '@/ui/BackButton/BackButton';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import GuideButton from '@/ui/guide/GuideButton/GuideButton';
import styles from '@/games/english-explorers/app/screens/HomeScreen.module.scss';

const ANIMALS = ['lion', 'rabbit', 'elephant'] as const;

export default function HomeScreen() {
  return (
    <div className={styles.home}>
      <BackButton className={styles.exit} label={TEXT.allGames} onClick={() => platformActions.exitToHub()} />

      <p className={styles.eyebrow}>{TEXT.eyebrow}</p>
      <h1 className={styles.logo} aria-label={`${TEXT.titleTop} ${TEXT.titleBottom}`}>
        <span className={styles.logoTop} aria-hidden="true">
          {TEXT.titleTop}
        </span>
        <span className={styles.logoBottom} aria-hidden="true">
          {TEXT.titleBottom}
        </span>
      </h1>
      <p className={styles.sub}>{TEXT.sub}</p>

      <div className={styles.animals}>
        {ANIMALS.map((name) => (
          <div key={name} className={styles.animal}>
            <Picture image={name} />
          </div>
        ))}
      </div>

      <div className={styles.buttons}>
        <Button
          color="pink"
          size="lg"
          className={styles.play}
          sfx={SFX.UI_START}
          onClick={() => {
            speech.unlock(); // iOS: giọng đọc chỉ bật được trong thao tác chạm
            englishExplorersActions.openSetup();
          }}
        >
          <Icon name="play" size={26} /> {TEXT.play}
        </Button>
        <AudioToggles />
        <GuideButton label={TEXT.guide} />
      </div>
    </div>
  );
}
