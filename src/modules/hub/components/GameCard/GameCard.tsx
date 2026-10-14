/**
 * Thẻ game ở màn chọn game:
 *   - GameCard: game chơi được (nút ▶) hoặc đang khoá (ảnh mờ + ổ khoá, giá kim cương thay nút ▶)
 *   - UpcomingCard: game sắp ra mắt (ảnh bìa bí ẩn + nhãn COMING SOON)
 */
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import type { GameManifest, UpcomingGame } from '@/core/types/game';
import Icon from '@/ui/Icon/Icon';
import { COMING_SOON_COVER } from '@/ui/icons';
import styles from '@/modules/hub/components/GameCard/GameCard.module.scss';

interface GameCardProps {
  game: GameManifest;
  locked: boolean;
  onClick: () => void;
}

export function GameCard({ game, locked, onClick }: GameCardProps) {
  return (
    <button
      type="button"
      className={clsx(styles.card, locked && styles.locked)}
      style={{ '--accent': game.accent } as CSSProperties}
      aria-label={locked ? `${game.title} — locked, ${game.price} gems` : game.title}
      onClick={onClick}
    >
      <span className={styles.media}>
        <img className={styles.cover} src={game.cover} alt="" />
        {locked && <Icon name="padlock" size={72} className={styles.lock} />}
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{game.title}</span>
        <span className={styles.tagline}>{game.tagline}</span>
        <span className={styles.skills}>
          {game.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </span>
        {locked ? (
          <span className={styles.price} aria-hidden="true">
            <Icon name="gemSmall" size={26} />
            {game.price}
          </span>
        ) : (
          <span className={styles.play} aria-hidden="true">
            <Icon name="play" size={28} />
          </span>
        )}
      </span>
    </button>
  );
}

export function UpcomingCard({ game, onClick }: { game: UpcomingGame; onClick: () => void }) {
  return (
    <button
      type="button"
      className={clsx(styles.card, styles.upcoming)}
      style={{ '--accent': 'var(--color-leaf)' } as CSSProperties}
      aria-label={`${game.title} — coming soon`}
      onClick={onClick}
    >
      <span className={styles.media}>
        <img className={clsx(styles.cover, styles.smooth)} src={COMING_SOON_COVER} alt="" />
        <span className={styles.ribbon}>COMING SOON</span>
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{game.title}</span>
        <span className={styles.tagline}>{game.tagline}</span>
        <span className={styles.soon} aria-hidden="true">
          SOON
        </span>
      </span>
    </button>
  );
}
