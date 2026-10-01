/**
 * Gốc của app: màn chọn game (hub), game đang mở, hoặc màn tài khoản (#/account/...).
 * Mỗi game được tải động (chunk riêng) khi mở lần đầu; rời game thì unmount toàn bộ (kể cả Phaser).
 * Màn tài khoản cũng là một chunk riêng, chỉ tải khi có API (ACCOUNT_ENABLED).
 */
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { ACCOUNT_ENABLED } from '@/platform/account/config';
import { useCatalog } from '@/platform/account/gamesSync';
import HubScreen from '@/platform/hub/HubScreen';
import { useStore } from '@/platform/hooks/useStore';
import { platformActions, platformStore } from '@/platform/platformStore';
import type { GameManifest, UpcomingGame } from '@/platform/types';
import Button from '@/platform/ui/Button';
import { useDelayedLoading } from '@/platform/hooks/useDelayedLoading';
import { MASCOT } from '@/platform/ui/icons';
import LottieLoader from '@/platform/ui/LottieLoader';
import RotateHint from '@/platform/ui/RotateHint';
import styles from '@/platform/PlatformApp.module.scss';

const lazyRoots = new Map<string, LazyExoticComponent<ComponentType>>();

/** `lazy()` phải được gọi một lần cho mỗi game để React không tải lại / mount lại */
function rootOf(game: GameManifest): LazyExoticComponent<ComponentType> {
  let root = lazyRoots.get(game.id);
  if (!root) {
    root = lazy(game.load);
    lazyRoots.set(game.id, root);
  }
  return root;
}

const AccountRoot = lazy(() => import('@/platform/account/screens/AccountRoot'));

interface PlatformAppProps {
  games: readonly GameManifest[];
  upcoming: readonly UpcomingGame[];
}

export default function PlatformApp({ games: baseGames, upcoming: baseUpcoming }: PlatformAppProps) {
  const route = useStore(platformStore, (state) => state.route);
  // Catalog server (ẩn / COMING SOON / giá) phủ lên manifest; không có API thì là manifest nguyên bản
  const catalog = useCatalog(baseGames, baseUpcoming);
  const { games, upcoming, isUnlocked } = catalog;

  const activeId = route.kind === 'game' ? route.gameId : null;
  // Link mở thẳng game đang khoá (#/<id>) -> về màn chọn game
  const game = games.find((item) => item.id === activeId && isUnlocked(item));
  const GameRoot = game ? rootOf(game) : null;
  const accountPage = route.kind === 'account' && ACCOUNT_ENABLED ? route.page : null;

  // Game không tồn tại / đang khoá, hoặc #/account khi không có API: bỏ hash để lần bấm thẻ game sau vẫn mở được
  useEffect(() => {
    if ((activeId && !game) || (route.kind === 'account' && !ACCOUNT_ENABLED)) platformActions.exitToHub();
  }, [activeId, game, route.kind]);

  const loading = <LoadingScreen />;

  return (
    <>
      {accountPage ? (
        <LoadErrorBoundary key="account">
          <Suspense fallback={loading}>
            <AccountRoot page={accountPage} games={games} />
          </Suspense>
        </LoadErrorBoundary>
      ) : GameRoot ? (
        <LoadErrorBoundary key={activeId}>
          <Suspense fallback={loading}>
            <GameRoot />
          </Suspense>
        </LoadErrorBoundary>
      ) : (
        <HubScreen games={games} upcoming={upcoming} isUnlocked={isUnlocked} />
      )}
      <RotateHint />
    </>
  );
}

/** Màn chờ tải chunk: nền vườn hiện ngay, linh vật + chấm nhún chỉ hiện sau 200ms (tải nhanh thì không nháy) */
function LoadingScreen() {
  const show = useDelayedLoading(true);
  return (
    <div className={styles.loading}>
      {show && (
        <>
          <img className={clsx(styles.mascot, styles.running)} src={MASCOT.loading} alt="" />
          <LottieLoader size="lg" label="LOADING…" />
        </>
      )}
    </div>
  );
}

/** Không tải được game (mất mạng khi chưa cache...) -> báo lỗi + quay lại màn chọn game */
class LoadErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  /** Ghi lỗi thật ra console để còn biết nguyên nhân (màn lỗi chỉ hiện câu chung chung) */
  override componentDidCatch(error: unknown): void {
    console.error('[Phonics Arcade] Screen failed to load:', error);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className={styles.loading}>
        <img className={styles.mascot} src={MASCOT.error} alt="" />
        <p>Oops! The game could not load.</p>
        {/* Tải lại trang: lấy lại file mới (vd sau khi deploy bản mới, file cũ đã bị xoá) */}
        <Button color="green" onClick={() => window.location.reload()}>
          TRY AGAIN
        </Button>
        <Button color="blue" onClick={() => platformActions.exitToHub()}>
          BACK TO GAMES
        </Button>
      </div>
    );
  }
}
