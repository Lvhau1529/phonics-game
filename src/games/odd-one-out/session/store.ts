/**
 * Trạng thái Odd One Out: màn đang mở + ván đang chơi + kết quả ván vừa xong.
 *
 *   home ─▶ setup ─▶ play ─▶ results
 *     │        ▲       │(QUIT) │
 *     └──▶ leaderboard ◀───────┘   (bảng xếp hạng mở từ home / results, BACK quay lại màn trước)
 *
 * Một câu trong ván:  choose ──chọn──▶ speak ──I'VE SPOKEN──▶ answer ──NEXT──▶ câu sau
 *                     (tắt SPEAKING STEP: choose ──chọn──▶ answer)
 * Ở bước speak bé vẫn đổi được hình đã chọn (bản gốc khoá lựa chọn ngay lần chạm đầu).
 */
import { MIXED, TOPICS } from '@/games/odd-one-out/content/puzzles';
import { oddOneOutManifest } from '@/games/odd-one-out/manifest';
import { rankOf, type BoardRecord } from '@/games/odd-one-out/session/leaderboard';
import {
  earnsSpeakingPoints,
  MIXED_COUNTS,
  pickPuzzles,
  scoreFor,
  starsFor,
} from '@/games/odd-one-out/session/rules';
import {
  addBoardRecord,
  boardStore,
  loadLastSetup,
  saveLastSetup,
} from '@/games/odd-one-out/session/storage';
import type { ActiveRound, LevelChoice, SetupDraft } from '@/games/odd-one-out/session/types';
import { postSoloResult } from '@/modules/results';
import { events } from '@/modules/analytics';
import { awardGems } from '@/modules/gems';
import { createStore } from '@/core/store/createStore';

export type Screen = 'home' | 'setup' | 'play' | 'results' | 'leaderboard';

export const MAX_NAME_LENGTH = 20;

export interface RoundOutcome {
  record: BoardRecord;
  stars: number;
  /** Hạng trong bảng cùng chủ đề + cấp + số câu; null = không phải lượt tốt nhất của tên này */
  rank: number | null;
  /** Kim cương nhận được (1 viên / câu đúng, tối đa 10 mỗi ván) */
  gemsEarned: number;
  /** clientSessionId gửi lên API (học sinh đã đăng nhập); null = không gửi */
  syncId: string | null;
}

export interface OddOneOutState {
  screen: Screen;
  /** Màn quay về khi rời bảng xếp hạng */
  boardReturn: Screen;
  draft: SetupDraft;
  round: ActiveRound | null;
  outcome: RoundOutcome | null;
}

const DEFAULT_DRAFT: SetupDraft = { name: '', topic: TOPICS[0].id, level: 'easy', count: 6, speaking: true };

function initialDraft(): SetupDraft {
  const saved = loadLastSetup();
  const topics = [...TOPICS.map((topic) => topic.id), MIXED.id];
  const levels: LevelChoice[] = ['easy', 'challenge', 'mix'];
  return {
    name: (saved.name ?? '').slice(0, MAX_NAME_LENGTH),
    topic: saved.topic && topics.includes(saved.topic) ? saved.topic : DEFAULT_DRAFT.topic,
    level: saved.level && levels.includes(saved.level) ? saved.level : DEFAULT_DRAFT.level,
    count: MIXED_COUNTS.find((count) => count === saved.count) ?? DEFAULT_DRAFT.count,
    speaking: saved.speaking ?? DEFAULT_DRAFT.speaking,
  };
}

export const oddOneOutStore = createStore<OddOneOutState>({
  screen: 'home',
  boardReturn: 'home',
  draft: initialDraft(),
  round: null,
  outcome: null,
});

let nextRoundId = 1;

function update(patch: Partial<OddOneOutState>): void {
  oddOneOutStore.set((state) => ({ ...state, ...patch }));
}

function updateRound(patch: Partial<ActiveRound>): void {
  const { round } = oddOneOutStore.get();
  if (round) update({ round: { ...round, ...patch } });
}

export const cleanName = (name: string): string => name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);

function createRound(settings: SetupDraft): ActiveRound {
  const now = Date.now();
  return {
    id: nextRoundId++,
    settings,
    puzzles: pickPuzzles(settings),
    index: 0,
    phase: 'choose',
    selected: null,
    records: [],
    score: 0,
    startedAt: now,
    puzzleStartedAt: now,
  };
}

/** Xem đáp án câu hiện tại: chấm điểm + dừng đồng hồ của câu */
function reveal(round: ActiveRound, spoke: boolean, heard: string): void {
  if (round.phase === 'answer' || round.selected === null) return;
  const current = round.puzzles[round.index];
  const record = {
    puzzleId: current.puzzle.id,
    chosen: round.selected,
    correct: round.selected === current.odd,
    spoke,
    heard,
    ms: Math.max(0, Date.now() - round.puzzleStartedAt),
  };
  update({
    round: {
      ...round,
      phase: 'answer',
      records: [...round.records, record],
      score: round.score + scoreFor(record),
    },
  });
}

/** Ván xong: lưu bảng xếp hạng, kim cương, gửi kết quả (Solo đã đăng nhập) */
function finishRound(round: ActiveRound): void {
  const { settings, records } = round;
  const correct = records.filter((record) => record.correct).length;
  const totalMs = records.reduce((sum, record) => sum + record.ms, 0);
  const record: BoardRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName(settings.name),
    topic: settings.topic,
    level: settings.level,
    count: records.length,
    score: round.score,
    correct,
    totalMs,
    createdAt: Date.now(),
  };
  addBoardRecord(record);
  const rank = rankOf(
    boardStore.get().records,
    { topic: record.topic, level: record.level, count: record.count },
    record.id,
  );
  const gemsEarned = awardGems(correct);
  const syncId = postSoloResult({
    gameId: oddOneOutManifest.id,
    levelId: settings.level,
    packId: settings.topic,
    correct,
    total: records.length,
    score: round.score,
    durationMs: Math.min(3_600_000, Math.max(0, Date.now() - round.startedAt)),
    endedBy: 'completed',
    details: {
      speaking: settings.speaking,
      spoke: records.filter((item) => item.spoke).length,
      wrong: records.filter((item) => !item.correct).map((item) => item.puzzleId),
      totalMs,
    },
  });
  if (!syncId) events.trackPlay(oddOneOutManifest.id, 'solo');
  update({
    screen: 'results',
    outcome: { record, stars: starsFor(correct, records.length), rank, gemsEarned, syncId },
  });
}

export const oddOneOutActions = {
  goHome(): void {
    update({ screen: 'home', round: null, outcome: null });
  },

  openSetup(): void {
    update({ screen: 'setup', round: null, outcome: null });
  },

  updateDraft(patch: Partial<SetupDraft>): void {
    const draft = { ...oddOneOutStore.get().draft, ...patch };
    saveLastSetup(draft);
    update({ draft });
  },

  /** Chưa có tên thì không vào ván (tên dùng cho bảng xếp hạng) */
  startRound(): boolean {
    const { draft } = oddOneOutStore.get();
    const name = cleanName(draft.name);
    if (!name) return false;
    const settings = { ...draft, name };
    saveLastSetup(settings);
    update({ screen: 'play', draft: settings, round: createRound(settings), outcome: null });
    return true;
  },

  playAgain(): void {
    const { round, draft } = oddOneOutStore.get();
    const settings = round?.settings ?? draft;
    update({ screen: 'play', round: createRound(settings), outcome: null });
  },

  /** Chạm một hình: bước choose -> sang bước nói (hoặc xem đáp án); bước speak -> đổi lựa chọn */
  choose(index: number): void {
    const { round } = oddOneOutStore.get();
    if (!round || round.phase === 'answer') return;
    if (round.phase === 'speak') {
      updateRound({ selected: index });
      return;
    }
    const next = { ...round, selected: index };
    if (round.settings.speaking) update({ round: { ...next, phase: 'speak' } });
    else reveal(next, false, '');
  },

  /** I'VE SPOKEN: `micAvailable` = máy có micro nghe được (không bị chặn) */
  submitSpeaking(heard: string, micAvailable: boolean): void {
    const { round } = oddOneOutStore.get();
    if (!round || round.phase !== 'speak') return;
    reveal(round, earnsSpeakingPoints(heard, micAvailable), heard);
  },

  next(): void {
    const { round } = oddOneOutStore.get();
    if (!round || round.phase !== 'answer') return;
    if (round.index + 1 >= round.puzzles.length) {
      finishRound(round);
      return;
    }
    updateRound({ index: round.index + 1, phase: 'choose', selected: null, puzzleStartedAt: Date.now() });
  },

  /** QUIT giữa ván -> về Setup, không lưu */
  quit(): void {
    update({ screen: 'setup', round: null, outcome: null });
  },

  openLeaderboard(): void {
    const { screen } = oddOneOutStore.get();
    if (screen === 'play') return;
    update({ screen: 'leaderboard', boardReturn: screen === 'leaderboard' ? 'home' : screen });
  },

  closeLeaderboard(): void {
    update({ screen: oddOneOutStore.get().boardReturn });
  },
};
