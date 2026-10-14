/**
 * Bảng xếp hạng lớp (GET /me/class/ranking): tab WEEK / MONTH / ALL + chip lọc theo game (ALL / từng game).
 * Dòng của chính mình được tô màu; không nằm trong danh sách thì ghim thêm ở cuối.
 * Đổi tab: giữ bảng cũ làm mờ tới khi có bảng mới (useRequest cache theo key); mở lại màn hiện ngay bản đã tải.
 */
import { useState } from 'react';
import clsx from 'clsx';
import type { GameId, RangePreset } from '@phonics/contracts';
import { pointsService } from '@/modules/points/services/pointsService';
import { useAuth } from '@/modules/auth/stores/authStore';
import { avatarUrl, isSceneAvatar } from '@/modules/auth/utils/avatars';
import { errorText } from '@/core/api/errorText';
import { useRequest } from '@/core/hooks/useRequest';
import type { RankingEntryModel } from '@/modules/points/models/RankingEntryModel';
import { useDelayedLoading } from '@/core/hooks/useDelayedLoading';
import { platformActions } from '@/app/stores/platformStore';
import type { GameManifest } from '@/core/types/game';
import Button from '@/ui/Button/Button';
import Icon from '@/ui/Icon/Icon';
import { MASCOT } from '@/ui/icons';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import OptionGroup, { type Option } from '@/ui/OptionGroup/OptionGroup';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/modules/points/screens/RankingScreen/RankingScreen.module.scss';

type Range = Extract<RangePreset, 'week' | 'month' | 'all'>;

const RANGES: Option<Range>[] = [
  { value: 'week', label: 'WEEK', tone: 'green' },
  { value: 'month', label: 'MONTH', tone: 'blue' },
  { value: 'all', label: 'ALL', tone: 'orange' },
];

const ALL_GAMES = 'all';

export default function RankingScreen({ games }: { games: readonly GameManifest[] }) {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>('week');
  const [gameId, setGameId] = useState<string>(ALL_GAMES);
  const gameFilter = gameId === ALL_GAMES ? undefined : (gameId as GameId);
  const ranking = useRequest(
    () => pointsService.classRanking(range, gameFilter),
    `${range}:${gameId}:${user?.id ?? ''}`,
  );

  const gameOptions: Option<string>[] = [
    { value: ALL_GAMES, label: 'ALL', tone: 'purple' },
    ...games.map((game) => ({ value: game.id, label: game.title, tone: 'purple' as const })),
  ];

  // Màn chờ lớn chỉ khi chưa có gì để hiện (trễ 200ms, giữ ≥ 400ms); đang có bảng thì chấm nhỏ ở header
  const showLoading = useDelayedLoading(ranking.loading);
  const showRefreshing = useDelayedLoading(ranking.isRefreshing);

  const items = ranking.data?.items ?? [];
  const me = ranking.data?.me ?? null;
  const mePinned = me !== null && !items.some((item) => item.isMe);

  return (
    <>
      <ScreenHeader
        title="RANKING"
        backLabel="My profile"
        onBack={() => platformActions.openAccount('profile')}
        trailing={showRefreshing && <LottieLoader size="sm" />}
      />

      <div className={styles.filters}>
        <OptionGroup label="Time" options={RANGES} value={range} onChange={setRange} />
        <OptionGroup
          label="Game"
          options={gameOptions}
          value={gameId}
          onChange={setGameId}
          columns={Math.min(3, gameOptions.length)}
        />
      </div>

      <section className={clsx(styles.board, ranking.stale && styles.stale)}>
        <h2 className={styles.className}>
          <Icon name="trophy" size={26} /> {ranking.data ? ranking.data.className : (user?.className ?? '')}
        </h2>
        {showLoading && <LottieLoader size="lg" label="LOADING…" className={styles.status} />}
        {ranking.error != null && (
          <div className={styles.errorBox}>
            <p className={styles.status}>{errorText(ranking.error)}</p>
            <Button color="cream" onClick={ranking.reload}>
              TRY AGAIN
            </Button>
          </div>
        )}
        {ranking.data && items.length === 0 && (
          <div className={styles.empty}>
            <img className={styles.mascot} src={MASCOT.encourage} alt="" />
            <p className={styles.status}>NO POINTS YET. PLAY TO GET ON THE BOARD!</p>
          </div>
        )}
        {items.length > 0 && (
          <ol className={styles.list}>
            {items.map((entry) => (
              <Row key={entry.studentId} entry={entry} />
            ))}
            {mePinned && me && <Row entry={me} pinned />}
          </ol>
        )}
      </section>
    </>
  );
}

function Row({ entry, pinned = false }: { entry: RankingEntryModel; pinned?: boolean }) {
  return (
    <li className={clsx(styles.row, entry.isMe && styles.me, pinned && styles.pinned)}>
      <span className={clsx(styles.rank, entry.isPodium && styles.top)}>
        {entry.isChampion ? (
          <Icon name="crown" size={30} />
        ) : entry.isPodium ? (
          <Icon name="medal" size={28} />
        ) : (
          entry.rank
        )}
      </span>
      <img
        className={clsx(styles.avatar, isSceneAvatar(entry.avatarKey) && styles.scene)}
        src={avatarUrl(entry.avatarKey)}
        alt=""
      />
      <span className={styles.name}>
        {entry.displayName}
        {entry.isMe && <small> (ME)</small>}
      </span>
      <span className={styles.points}>
        <Icon name="star" size={18} /> {entry.points}
      </span>
    </li>
  );
}
