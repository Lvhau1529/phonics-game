/**
 * Bảng xếp hạng trên máy này: bục 3 hạng đầu + bảng (tối đa 100 dòng), lọc theo chủ đề / cấp / số câu.
 * Mở từ màn kết quả thì bộ lọc đặt sẵn đúng ván vừa chơi và tô sáng dòng của ván đó.
 *
 * Lỗi của bản gốc đã sửa: lựa chọn "số câu" chỉ có 3/6/9/12/15/30/90 -> ván 45 câu (MIXED + EASY) không có
 * trong danh sách, bộ lọc rỗng, bảng báo "No scores yet!" ngay sau khi chơi. Ở đây lựa chọn lấy từ dữ liệu.
 */
import { useState } from 'react';
import clsx from 'clsx';
import { formatDuration } from '@/games/odd-one-out/app/format';
import { useBoard, useOddOneOut } from '@/games/odd-one-out/app/hooks';
import { getTopic, MIXED, TOPICS } from '@/games/odd-one-out/content/puzzles';
import {
  ALL_FILTER,
  boardCounts,
  rankBoard,
  type BoardFilter,
  type BoardRecord,
} from '@/games/odd-one-out/session/leaderboard';
import { levelLabel } from '@/games/odd-one-out/session/rules';
import { clearBoard } from '@/games/odd-one-out/session/storage';
import { oddOneOutActions } from '@/games/odd-one-out/session/store';
import { TEXT } from '@/games/odd-one-out/session/text';
import Button from '@/ui/Button/Button';
import Dialog from '@/ui/Dialog/Dialog';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import { MASCOT } from '@/ui/icons';
import styles from '@/games/odd-one-out/app/screens/LeaderboardScreen.module.scss';

const MEDALS = ['🥇', '🥈', '🥉'];
const MAX_ROWS = 100;

export default function LeaderboardScreen() {
  const records = useBoard();
  const last = useOddOneOut((state) => (state.boardReturn === 'results' ? state.outcome?.record : undefined));
  const [filter, setFilter] = useState<BoardFilter>(() =>
    last ? { topic: last.topic, level: last.level, count: last.count } : ALL_FILTER,
  );
  const [confirmClear, setConfirmClear] = useState(false);
  const rows = rankBoard(records, filter);
  const counts = boardCounts(records);

  return (
    <div className={styles.board}>
      <ScreenHeader
        title={TEXT.boardTitle}
        backLabel={TEXT.back}
        onBack={() => oddOneOutActions.closeLeaderboard()}
      />
      <p className={styles.sub}>🏅 {TEXT.boardSub}</p>

      <Podium
        rows={rows.slice(0, 3)}
        empty={records.length === 0 ? TEXT.boardEmpty : TEXT.boardEmptyFilter}
      />

      <div className={styles.filters}>
        <label>
          🎨
          <select
            value={filter.topic}
            onChange={(event) => setFilter({ ...filter, topic: event.target.value })}
            aria-label={TEXT.topic}
          >
            <option value="all">{TEXT.allTopics}</option>
            {[...TOPICS, MIXED].map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          🚀
          <select
            value={filter.level}
            onChange={(event) => setFilter({ ...filter, level: event.target.value as BoardFilter['level'] })}
            aria-label={TEXT.level}
          >
            <option value="all">{TEXT.allLevels}</option>
            <option value="easy">{TEXT.easy}</option>
            <option value="challenge">{TEXT.challenge}</option>
            <option value="mix">{TEXT.mix}</option>
          </select>
        </label>
        <label>
          🧩
          <select
            value={String(filter.count)}
            onChange={(event) =>
              setFilter({
                ...filter,
                count: event.target.value === 'all' ? 'all' : Number(event.target.value),
              })
            }
            aria-label={TEXT.puzzles}
          >
            <option value="all">
              {TEXT.allLengths} {TEXT.puzzles}
            </option>
            {counts.map((count) => (
              <option key={count} value={count}>
                {count} {TEXT.puzzles}
              </option>
            ))}
          </select>
        </label>
      </div>

      {rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>{TEXT.student}</th>
                <th>⭐</th>
                <th>✅</th>
                <th>⏱</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, MAX_ROWS).map((row, index) => (
                <tr key={row.id} className={clsx(row.id === last?.id && styles.highlight)}>
                  <td className={styles.place}>{MEDALS[index] ?? index + 1}</td>
                  <td className={styles.name}>
                    {row.name}
                    <small>
                      {getTopic(row.topic).emoji} {levelLabel(row.level)} · {row.count}
                    </small>
                  </td>
                  <td className={styles.points}>{row.score}</td>
                  <td>
                    {row.correct}/{row.count}
                  </td>
                  <td>{formatDuration(row.totalMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className={styles.note}>{TEXT.boardNote}</p>
      {records.length > 0 && (
        <button type="button" className={styles.clear} onClick={() => setConfirmClear(true)}>
          🗑️ {TEXT.clear}
        </button>
      )}

      {confirmClear && (
        <Dialog
          title={TEXT.clearTitle}
          image={MASCOT.error}
          onClose={() => setConfirmClear(false)}
          actions={
            <>
              <Button color="green" onClick={() => setConfirmClear(false)}>
                {TEXT.cancel}
              </Button>
              <Button
                color="red"
                onClick={() => {
                  clearBoard();
                  setConfirmClear(false);
                }}
              >
                {TEXT.clearYes}
              </Button>
            </>
          }
        >
          <p>{TEXT.clearBody}</p>
        </Dialog>
      )}
    </div>
  );
}

function Podium({ rows, empty }: { rows: BoardRecord[]; empty: string }) {
  if (rows.length === 0) return <p className={styles.empty}>🎈 {empty}</p>;
  return (
    <ol className={styles.podium}>
      {rows.map((row, index) => (
        <li key={row.id} className={styles[`place${index + 1}`]}>
          <span className={styles.medal}>{MEDALS[index]}</span>
          <span className={styles.podiumName}>{row.name}</span>
          <span className={styles.podiumScore}>⭐ {row.score}</span>
          <span className={styles.podiumTime}>⏱ {formatDuration(row.totalMs)}</span>
        </li>
      ))}
    </ol>
  );
}
