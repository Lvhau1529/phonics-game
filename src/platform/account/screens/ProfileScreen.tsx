/**
 * Hồ sơ học sinh: avatar lớn, tên, lớp, tổng điểm + hạng trong lớp (GET /me/points), MY GAMES
 * (điểm từng game, đã mở / đang khoá), nút RANKING · MESSAGES (chuông + số chưa đọc) · EDIT · SIGN OUT.
 */
import { useState } from 'react';
import clsx from 'clsx';
import { getMyPoints } from '@/platform/account/accountApi';
import { authActions, useAuth } from '@/platform/account/authStore';
import { avatarUrl, isSceneAvatar } from '@/platform/account/avatars';
import { errorText } from '@/platform/account/errorText';
import { catalogStore, isUnlocked } from '@/platform/account/gamesSync';
import { useRequest } from '@/platform/account/hooks/useRequest';
import { useUnreadCount } from '@/platform/account/notificationsStore';
import { useDelayedLoading } from '@/platform/hooks/useDelayedLoading';
import { walletStore } from '@/platform/gems/wallet';
import { useStore } from '@/platform/hooks/useStore';
import { platformActions } from '@/platform/platformStore';
import type { GameManifest } from '@/platform/types';
import Button from '@/platform/ui/Button';
import Dialog from '@/platform/ui/Dialog';
import Icon from '@/platform/ui/Icon';
import { MASCOT } from '@/platform/ui/icons';
import LottieLoader from '@/platform/ui/LottieLoader';
import ScreenHeader from '@/platform/ui/ScreenHeader';
import BellIcon from '@/platform/ui/svg/BellIcon';
import styles from '@/platform/account/screens/ProfileScreen.module.scss';

export default function ProfileScreen({ games }: { games: readonly GameManifest[] }) {
  const { user } = useAuth();
  const unread = useUnreadCount();
  const points = useRequest(() => getMyPoints('all'), `points:${user?.id ?? ''}`);
  const mine = useStore(catalogStore, (state) => state.mine);
  const wallet = useStore(walletStore, (state) => state);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  // Chưa có điểm để hiện (lần đầu, không cache): chấm nhún trong ô POINTS / RANK
  const showLoading = useDelayedLoading(points.loading);
  if (!user) return null;

  const pointsByGame = new Map(points.data?.byGame.map((item) => [item.gameId as string, item.points]) ?? []);
  const rank = points.data?.class?.rank ?? null;

  return (
    <>
      <ScreenHeader title="MY PROFILE" backLabel="All games" onBack={() => platformActions.exitToHub()} />

      <section className={styles.card}>
        <img
          className={clsx(styles.avatar, isSceneAvatar(user.avatarKey) && styles.scene)}
          src={avatarUrl(user.avatarKey)}
          alt=""
        />
        <h2 className={styles.name}>{user.displayName}</h2>
        <p className={styles.classLine}>{user.class ? `CLASS ${user.class.name}` : 'NO CLASS YET'}</p>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>
              <Icon name="star" size={22} /> POINTS
            </dt>
            <dd>{points.data ? points.data.total : showLoading ? <LottieLoader size="sm" /> : '…'}</dd>
          </div>
          <div className={styles.stat}>
            <dt>
              <Icon name="trophy" size={22} /> RANK
            </dt>
            <dd>
              {points.data ? (
                rank !== null ? (
                  `#${rank}`
                ) : (
                  '—'
                )
              ) : showLoading ? (
                <LottieLoader size="sm" />
              ) : (
                '…'
              )}
            </dd>
          </div>
        </dl>
        {points.error != null && (
          <p className={styles.error} role="alert">
            {errorText(points.error)}
          </p>
        )}
      </section>

      <section className={styles.games}>
        <h3>MY GAMES</h3>
        <ul>
          {games.map((game) => {
            const unlocked = isUnlocked(game, wallet, { items: null, mine });
            const gamePoints =
              pointsByGame.get(game.id) ?? mine?.find((item) => item.gameId === game.id)?.points ?? 0;
            return (
              <li key={game.id} className={clsx(styles.game, !unlocked && styles.locked)}>
                <img className={styles.cover} src={game.cover} alt="" />
                <span className={styles.gameTitle}>{game.title}</span>
                <span className={styles.gamePoints}>
                  <Icon name="star" size={18} /> {gamePoints}
                </span>
                {!unlocked && <Icon name="padlock" size={26} className={styles.lock} />}
              </li>
            );
          })}
        </ul>
      </section>

      <div className={styles.actions}>
        <Button color="orange" onClick={() => platformActions.openAccount('ranking')}>
          <Icon name="trophy" size={24} /> RANKING
        </Button>
        <Button
          color="blue"
          className={styles.messages}
          onClick={() => platformActions.openAccount('notifications')}
        >
          <BellIcon size={22} /> MESSAGES
          {unread > 0 && <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
        </Button>
        <Button color="purple" onClick={() => platformActions.openAccount('edit')}>
          <Icon name="settings" size={24} /> EDIT
        </Button>
        <Button color="cream" onClick={() => setConfirmSignOut(true)}>
          SIGN OUT
        </Button>
      </div>

      {confirmSignOut && (
        <Dialog
          title="SIGN OUT?"
          image={MASCOT.hello}
          onClose={() => setConfirmSignOut(false)}
          actions={
            <>
              <Button color="cream" onClick={() => setConfirmSignOut(false)}>
                STAY
              </Button>
              <Button
                color="red"
                onClick={() => {
                  setConfirmSignOut(false);
                  void authActions.signOut();
                  platformActions.exitToHub();
                }}
              >
                SIGN OUT
              </Button>
            </>
          }
        >
          <p>Your points are safe. See you soon, {user.displayName}!</p>
        </Dialog>
      )}
    </>
  );
}
