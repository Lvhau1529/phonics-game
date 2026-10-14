/**
 * Main menu (plan §3): nút PLAY vào Setup, bật tắt âm thanh, mở Hướng dẫn, quay về màn chọn game.
 */
import { mascotUrl } from '@/games/bread-catcher/app/assets';
import { sessionActions } from '@/games/bread-catcher/session/sessionStore';
import { SOLO_MASCOT, TEAM_MASCOTS } from '@/games/bread-catcher/session/teams';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import { SFX } from '@/core/audio/sfx';
import { platformActions } from '@/core/navigation/platformStore';
import AudioToggles from '@/ui/AudioToggles/AudioToggles';
import BackButton from '@/ui/BackButton/BackButton';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import GuideButton from '@/ui/guide/GuideButton/GuideButton';
import styles from '@/games/bread-catcher/app/screens/HomeScreen.module.scss';

/** Mỗi chữ của "PHONICS" một màu như concept board */
const TITLE_LETTERS = 'PHONICS'.split('');

export default function HomeScreen() {
  return (
    <div className={styles.home}>
      <BackButton
        className={styles.exit}
        label={UI_TEXT.allGames}
        onClick={() => platformActions.exitToHub()}
      />
      <h1 className={styles.logo} aria-label={UI_TEXT.title}>
        <span className={styles.logoTop} aria-hidden="true">
          {TITLE_LETTERS.map((letter, index) => (
            <span key={index} className={styles.letter}>
              {letter}
            </span>
          ))}
        </span>
        <span className={styles.logoBottom} aria-hidden="true">
          BREAD CATCHER
        </span>
      </h1>

      <div className={styles.mascots} aria-hidden="true">
        {[...TEAM_MASCOTS, SOLO_MASCOT].map((mascot, index) => (
          <img key={mascot} src={mascotUrl(mascot)} alt="" style={{ animationDelay: `${index * 0.15}s` }} />
        ))}
      </div>

      <div className={styles.actions}>
        {/* Chọn Class / Solo ở GAME MODE trong Setup (nhớ lựa chọn lần trước) */}
        <Button
          color="orange"
          size="lg"
          className={styles.play}
          sfx={SFX.UI_START}
          onClick={() => sessionActions.openSetup()}
        >
          <Icon name="play" size={26} /> {UI_TEXT.play}
        </Button>
      </div>

      <AudioToggles className={styles.toggles} />
      <GuideButton label={UI_TEXT.guide} className={styles.guide} />
    </div>
  );
}
