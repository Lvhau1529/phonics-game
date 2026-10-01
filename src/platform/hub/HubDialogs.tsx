/**
 * Hộp thoại của màn chọn game (chữ tiếng Anh, ngắn, cho bé 4–6 tuổi):
 *   gems     — bấm bộ đếm kim cương: động viên bé chăm chỉ để có kim cương mở game mới
 *   locked   — bấm game đang khoá khi chưa đủ kim cương
 *   unlock   — đủ kim cương: hỏi có mở khoá không
 *   unlocked — vừa mở khoá xong
 *   soon     — bấm thẻ COMING SOON
 */
import { SFX } from '@/platform/audio/sfx';
import { unlockWithGems } from '@/platform/account/gamesSync';
import { GEM_RULES, walletStore } from '@/platform/gems/wallet';
import { useStore } from '@/platform/hooks/useStore';
import type { GameManifest } from '@/platform/types';
import Button from '@/platform/ui/Button';
import Dialog from '@/platform/ui/Dialog';
import Icon from '@/platform/ui/Icon';
import { MASCOT } from '@/platform/ui/icons';
import styles from '@/platform/hub/HubDialogs.module.scss';

export type HubDialogState =
  { kind: 'gems' } | { kind: 'locked' | 'unlock' | 'unlocked'; game: GameManifest } | { kind: 'soon' };

interface HubDialogsProps {
  dialog: HubDialogState;
  games: readonly GameManifest[];
  isUnlocked: (game: GameManifest) => boolean;
  onChange: (next: HubDialogState | null) => void;
  onPlay: (game: GameManifest) => void;
}

const EARN_RULE = `Every right answer = ${GEM_RULES.perCorrect} gem (up to ${GEM_RULES.maxPerSession} per game).`;

export default function HubDialogs({ dialog, games, isUnlocked, onChange, onPlay }: HubDialogsProps) {
  const wallet = useStore(walletStore, (state) => state);
  const close = () => onChange(null);
  const practice = (
    <Button color="green" onClick={close}>
      LET&apos;S PRACTICE!
    </Button>
  );

  switch (dialog.kind) {
    case 'gems': {
      // Game khoá rẻ nhất chưa mở: mục tiêu gần nhất để bé phấn đấu
      const next = games
        .filter((game) => !isUnlocked(game))
        .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
      return (
        <Dialog title="KEEP GOING!" image={MASCOT.encourage} onClose={close} actions={practice}>
          <GemTotal gems={wallet.gems} />
          <p>Practice hard and get the answers right to earn more gems!</p>
          {next ? (
            <p>
              You need <b>{Math.max(0, (next.price ?? 0) - wallet.gems)} more gems</b> to unlock{' '}
              <b>{next.title}</b>.
            </p>
          ) : (
            <p>Save your gems — they will unlock new games!</p>
          )}
          <p className={styles.note}>{EARN_RULE}</p>
        </Dialog>
      );
    }

    case 'locked': {
      const price = dialog.game.price ?? 0;
      return (
        <Dialog
          title="KEEP GOING!"
          image={MASCOT.encourage}
          openSfx={SFX.NOT_ENOUGH_GEMS}
          onClose={close}
          actions={practice}
        >
          <p>
            You need <b>{Math.max(0, price - wallet.gems)} more gems</b> to unlock <b>{dialog.game.title}</b>.
          </p>
          <GemProgress gems={wallet.gems} price={price} />
          <p>Practice hard and get the answers right to earn them!</p>
          <p className={styles.note}>{EARN_RULE}</p>
        </Dialog>
      );
    }

    case 'unlock':
      return (
        <Dialog
          title={`UNLOCK ${dialog.game.title}?`}
          image={MASCOT.hello}
          onClose={close}
          actions={
            <>
              <Button color="cream" onClick={close}>
                NOT NOW
              </Button>
              <Button
                color="green"
                sfx={null}
                onClick={() => onChange(unlockWithGems(dialog.game) ? { ...dialog, kind: 'unlocked' } : null)}
              >
                UNLOCK
              </Button>
            </>
          }
        >
          <p>
            Use <GemAmount amount={dialog.game.price ?? 0} /> to unlock this game.
          </p>
          <GemTotal gems={wallet.gems} />
        </Dialog>
      );

    case 'unlocked':
      return (
        <Dialog
          title="UNLOCKED!"
          image={MASCOT.celebrate}
          openSfx={SFX.UNLOCK}
          celebrate
          onClose={close}
          actions={
            <Button color="green" sfx={SFX.UI_START} onClick={() => onPlay(dialog.game)}>
              <Icon name="play" size={24} /> PLAY NOW
            </Button>
          }
        >
          <p>
            <b>{dialog.game.title}</b> is ready to play!
          </p>
        </Dialog>
      );

    case 'soon':
      return (
        <Dialog
          title="COMING SOON!"
          image={MASCOT.comingSoon}
          openSfx={SFX.COMING_SOON}
          onClose={close}
          actions={
            <Button color="orange" onClick={close}>
              OK!
            </Button>
          }
        >
          <p>A new game is on the way.</p>
          <p>Keep learning and collect gems for it!</p>
        </Dialog>
      );
  }
}

function GemAmount({ amount }: { amount: number }) {
  return (
    <b className={styles.amount}>
      <Icon name="gemSmall" size={22} />
      {amount}
    </b>
  );
}

function GemTotal({ gems }: { gems: number }) {
  return (
    <p className={styles.gems}>
      YOU HAVE <GemAmount amount={gems} />
    </p>
  );
}

function GemProgress({ gems, price }: { gems: number; price: number }) {
  const percent = price > 0 ? Math.min(100, (gems / price) * 100) : 100;
  return (
    <div className={styles.progress} role="img" aria-label={`${gems} of ${price} gems`}>
      <span className={styles.progressFill} style={{ width: `${percent}%` }} />
      <span className={styles.progressLabel}>
        <Icon name="gemSmall" size={20} />
        {gems} / {price}
      </span>
    </div>
  );
}
