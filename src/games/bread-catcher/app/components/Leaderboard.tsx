/**
 * CLASS LEADERBOARD — tổng điểm các đội qua nhiều buổi (lưu localStorage).
 *
 * Ở màn Results: bảng hiện theo thứ tự CŨ, sau một nhịp thì các hàng trượt tới thứ tự MỚI
 * (đội vượt hạng bay lên kèm "RANK UP!"), tổng điểm đếm tăng dần.
 * Các hàng đặt tuyệt đối theo chỉ số hạng nên chỉ cần đổi translateY là CSS tự chạy hiệu ứng.
 */
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { mascotUrl } from '@/games/bread-catcher/app/assets';
import Button from '@/ui/Button/Button';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { useTeamTotals } from '@/games/bread-catcher/app/hooks';
import {
  rankTotals,
  type LeaderboardRow,
  type LeaderboardUpdate,
} from '@/games/bread-catcher/session/leaderboard';
import { sessionActions } from '@/games/bread-catcher/session/sessionStore';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import styles from '@/games/bread-catcher/app/components/Leaderboard.module.scss';

/** Chiều cao mỗi hàng + khoảng cách (px) — khớp với .row trong Leaderboard.module.scss */
const ROW_STEP = 66;
/** Màu theo hạng 1–3 (Class Mode có 3 đội) */
const PLACE_CLASS = [styles.place1, styles.place2, styles.place3];
/** Giữ bảng cũ ngần này rồi mới "xếp lại" */
const REORDER_DELAY_MS = 900;
const COUNT_UP_MS = 900;

/** Đếm số từ `from` tới `to` khi `active` */
function useCountUp(from: number, to: number, active: boolean): number {
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (!active) {
      setValue(from);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      setValue(Math.round(from + (to - from) * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, to, active]);
  return value;
}

interface LeaderboardProps {
  update: LeaderboardUpdate;
}

export default function Leaderboard({ update }: LeaderboardProps) {
  const { before, after, gained } = update;
  // Lần đầu chơi (chưa có điểm cũ) thì không cần diễn lại thứ tự cũ
  const isFirstGame = before.every((row) => row.games === 0);
  const [reordered, setReordered] = useState(isFirstGame);

  const rankUps = after.filter((row) => {
    const previous = before.find((old) => old.teamId === row.teamId);
    return !isFirstGame && previous !== undefined && row.place < previous.place;
  });

  useEffect(() => {
    if (reordered) return undefined;
    const timer = window.setTimeout(() => {
      setReordered(true);
      if (rankUps.length > 0) playSfx(SFX.TEAM_SELECTED);
    }, REORDER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []); // chỉ chạy một lần khi bảng xuất hiện

  const order = reordered ? after : before;
  // DOM giữ thứ tự cố định theo đội; vị trí hiển thị do translateY quyết định
  const rows = [...after].sort((a, b) => a.teamId - b.teamId);

  return (
    <section className={styles.leaderboard} aria-label={UI_TEXT.leaderboard}>
      <LeaderboardHeader />
      <ol className={styles.list} style={{ height: rows.length * ROW_STEP }}>
        {rows.map((row) => {
          const index = order.findIndex((entry) => entry.teamId === row.teamId);
          const shown = order[index];
          const previous = before.find((old) => old.teamId === row.teamId);
          const isRankUp = reordered && rankUps.some((up) => up.teamId === row.teamId);
          return (
            <LeaderboardItem
              key={row.teamId}
              row={{ ...row, place: shown?.place ?? row.place }}
              from={previous?.total ?? 0}
              counting={reordered}
              gained={gained[row.teamId] ?? 0}
              rankUp={isRankUp}
              y={index * ROW_STEP}
            />
          );
        })}
      </ol>
    </section>
  );
}

interface ItemProps {
  row: LeaderboardRow;
  from: number;
  counting: boolean;
  gained: number;
  rankUp: boolean;
  y: number;
}

function LeaderboardItem({ row, from, counting, gained, rankUp, y }: ItemProps) {
  const total = useCountUp(from, row.total, counting);
  return (
    <li
      className={clsx(styles.row, PLACE_CLASS[Math.min(row.place, 3) - 1], rankUp && styles.rankUp)}
      style={{ transform: `translateY(${y}px)` }}
    >
      <span className={styles.place}>{row.place}</span>
      <img className={styles.mascot} src={mascotUrl(row.mascot)} alt="" width={36} height={40} />
      <span className={styles.info}>
        <span className={styles.name} title={row.name}>
          {row.name}
        </span>
        {(rankUp || (counting && gained > 0)) && (
          <span className={styles.meta}>
            {rankUp && <span className={styles.badge}>▲ {UI_TEXT.rankUp}</span>}
            {counting && gained > 0 && <span className={styles.gained}>+{gained}</span>}
          </span>
        )}
      </span>
      <span className={styles.total}>{total}</span>
    </li>
  );
}

/**
 * Bảng tổng điểm tĩnh (đọc thẳng từ localStorage) — dùng ở Setup và khi vừa reset ở Results.
 */
export function TeamTotalsCard() {
  const totals = useTeamTotals();
  const rows = rankTotals(totals);
  return (
    <section className={styles.leaderboard} aria-label={UI_TEXT.leaderboard}>
      <LeaderboardHeader canReset={rows.length > 0} />
      {rows.length === 0 ? (
        <p className={styles.empty}>{UI_TEXT.noScoresYet}</p>
      ) : (
        <ol className={clsx(styles.list, styles.stacked)}>
          {rows.map((row) => (
            <li key={row.teamId} className={clsx(styles.row, PLACE_CLASS[Math.min(row.place, 3) - 1])}>
              <span className={styles.place}>{row.place}</span>
              <img className={styles.mascot} src={mascotUrl(row.mascot)} alt="" width={36} height={40} />
              <span className={styles.info}>
                <span className={styles.name} title={row.name}>
                  {row.name}
                </span>
                <span className={styles.games}>
                  {row.games} {UI_TEXT.games}
                </span>
              </span>
              <span className={styles.total}>{row.total}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function LeaderboardHeader({ canReset = true }: { canReset?: boolean }) {
  return (
    <header className={styles.header}>
      <h2>{UI_TEXT.leaderboard}</h2>
      {canReset && <ResetScoresButton />}
    </header>
  );
}

/** Nút reset có bước xác nhận ngay tại chỗ */
function ResetScoresButton() {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" className={styles.reset} onClick={() => setConfirming(true)}>
        {UI_TEXT.resetScores}
      </button>
    );
  }
  return (
    <div className={styles.confirm} role="alertdialog" aria-label={UI_TEXT.resetScoresQuestion}>
      <span>{UI_TEXT.resetScoresQuestion}</span>
      <Button color="blue" onClick={() => setConfirming(false)}>
        {UI_TEXT.cancel}
      </Button>
      <Button
        color="red"
        onClick={() => {
          sessionActions.resetTeamTotals();
          setConfirming(false);
        }}
      >
        {UI_TEXT.reset}
      </Button>
    </div>
  );
}
