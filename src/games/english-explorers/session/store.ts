/**
 * Trạng thái Little English Explorers: màn đang mở + ván đang chơi + kết quả ván vừa xong.
 *
 *   home ─▶ setup ─▶ play ─▶ results
 *              ▲        │(QUIT)  │ (NEXT WORLD / PLAY AGAIN / CHOOSE WORLD)
 *              └────────┴────────┘
 *
 * Một câu:  choose ──đúng──▶ speak ──NEXT / I SAID IT!──▶ câu sau   (tắt SAY IT: choose ──đúng──▶ done ──NEXT──▶)
 *           chọn sai: đáp án đó mờ đi, bé chọn lại (điểm giảm theo số lần sai)
 *
 * Lỗi của bản gốc đã sửa: chọn rồi không đổi được; vào lại cùng thế giới để cộng điểm mãi (điểm giờ tính
 * theo ván, kỷ lục lưu riêng từng thế giới); Esc ở màn chào bỏ qua bước nhập tên.
 */
import { ALL_WORLDS, getWorld, WORLDS } from '@/games/english-explorers/content/worlds';
import { englishExplorersManifest } from '@/games/english-explorers/manifest';
import {
  earnsSpeakingPoints,
  pickQuestions,
  pointsFor,
  SCORING,
  starsFor,
} from '@/games/english-explorers/session/rules';
import {
  loadLastSetup,
  recordProgress,
  saveLastSetup,
  type WorldProgress,
} from '@/games/english-explorers/session/storage';
import type { ActiveRound, QuestionRecord, SetupDraft } from '@/games/english-explorers/session/types';
import { postSoloResult } from '@/modules/results';
import { events } from '@/modules/analytics';
import { awardGems } from '@/modules/gems';
import { createStore } from '@/core/store/createStore';

export type Screen = 'home' | 'setup' | 'play' | 'results';

export const MAX_NAME_LENGTH = 20;

export interface RoundOutcome {
  stars: number;
  firstTry: number;
  spoken: number;
  previous?: WorldProgress;
  gemsEarned: number;
  syncId: string | null;
}

export interface EnglishExplorersState {
  screen: Screen;
  draft: SetupDraft;
  round: ActiveRound | null;
  outcome: RoundOutcome | null;
}

function initialDraft(): SetupDraft {
  const saved = loadLastSetup();
  const worlds = [...WORLDS.map((world) => world.id), ALL_WORLDS];
  return {
    name: (saved.name ?? '').slice(0, MAX_NAME_LENGTH),
    world: saved.world && worlds.includes(saved.world) ? saved.world : WORLDS[0].id,
    speaking: saved.speaking ?? true,
  };
}

export const englishExplorersStore = createStore<EnglishExplorersState>({
  screen: 'home',
  draft: initialDraft(),
  round: null,
  outcome: null,
});

let nextRoundId = 1;

function update(patch: Partial<EnglishExplorersState>): void {
  englishExplorersStore.set((state) => ({ ...state, ...patch }));
}

function updateRound(patch: Partial<ActiveRound>): void {
  const { round } = englishExplorersStore.get();
  if (round) update({ round: { ...round, ...patch } });
}

export const cleanName = (name: string): string => name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);

function createRound(settings: SetupDraft): ActiveRound {
  return {
    id: nextRoundId++,
    settings,
    questions: pickQuestions(settings.world),
    index: 0,
    phase: 'choose',
    wrong: [],
    records: [],
    score: 0,
    startedAt: Date.now(),
  };
}

function finishRound(round: ActiveRound): void {
  const { settings, records } = round;
  const total = records.length;
  const firstTry = records.filter((record) => record.misses === 0).length;
  const spoken = records.filter((record) => record.spoke).length;
  const stars = starsFor(firstTry, total);
  const previous = recordProgress(settings.world, stars, round.score);
  const gemsEarned = awardGems(firstTry);
  const syncId = postSoloResult({
    gameId: englishExplorersManifest.id,
    levelId: settings.world,
    correct: firstTry,
    total,
    score: round.score,
    durationMs: Math.min(3_600_000, Math.max(0, Date.now() - round.startedAt)),
    endedBy: 'completed',
    details: {
      stars,
      speaking: settings.speaking,
      spoken,
      missed: records.filter((record) => record.misses > 0).map((record) => record.questionId),
    },
  });
  if (!syncId) events.trackPlay(englishExplorersManifest.id, 'solo');
  update({ screen: 'results', outcome: { stars, firstTry, spoken, previous, gemsEarned, syncId } });
}

/** Ghi câu hiện tại (đã chọn đúng) với điểm nói */
function completeQuestion(round: ActiveRound, spoke: boolean, heard: string): ActiveRound {
  const current = round.questions[round.index];
  const misses = round.wrong.length;
  const record: QuestionRecord = {
    questionId: current.question.id,
    misses,
    spoke,
    heard,
    points: pointsFor(misses) + (spoke ? SCORING.spoke : 0),
  };
  return { ...round, records: [...round.records, record], score: round.score + record.points };
}

function advance(round: ActiveRound): void {
  if (round.index + 1 >= round.questions.length) {
    update({ round });
    finishRound(round);
    return;
  }
  update({ round: { ...round, index: round.index + 1, phase: 'choose', wrong: [] } });
}

export const englishExplorersActions = {
  goHome(): void {
    update({ screen: 'home', round: null, outcome: null });
  },

  openSetup(): void {
    update({ screen: 'setup', round: null, outcome: null });
  },

  updateDraft(patch: Partial<SetupDraft>): void {
    const draft = { ...englishExplorersStore.get().draft, ...patch };
    saveLastSetup(draft);
    update({ draft });
  },

  startRound(world?: string): void {
    const { draft } = englishExplorersStore.get();
    const settings = { ...draft, name: cleanName(draft.name), world: world ?? draft.world };
    saveLastSetup(settings);
    update({ screen: 'play', draft: settings, round: createRound(settings), outcome: null });
  },

  playAgain(): void {
    const { round, draft } = englishExplorersStore.get();
    update({ screen: 'play', round: createRound(round?.settings ?? draft), outcome: null });
  },

  /** Thế giới kế tiếp (sau thế giới cuối / ALL WORLDS thì không có) */
  playNextWorld(): void {
    const next = nextWorldId(englishExplorersStore.get().round?.settings.world ?? '');
    if (next) englishExplorersActions.startRound(next);
  },

  /** Chọn đáp án: đúng -> bước nói (hoặc done); sai -> đánh dấu, chọn lại. Trả về đúng / sai */
  choose(index: number): boolean | null {
    const { round } = englishExplorersStore.get();
    if (!round || round.phase !== 'choose' || round.wrong.includes(index)) return null;
    const current = round.questions[round.index];
    if (index !== current.answer) {
      updateRound({ wrong: [...round.wrong, index] });
      return false;
    }
    updateRound({ phase: round.settings.speaking ? 'speak' : 'done' });
    return true;
  },

  /** Bước nói xong (NEXT / I SAID IT!) -> ghi câu, sang câu sau */
  submitSpeaking(heard: string, micAvailable: boolean): void {
    const { round } = englishExplorersStore.get();
    if (!round || round.phase !== 'speak') return;
    const sentence = round.questions[round.index].question.sentence;
    advance(completeQuestion(round, earnsSpeakingPoints(heard, sentence, micAvailable), heard));
  },

  /** Tắt bước nói: NEXT sau khi chọn đúng */
  next(): void {
    const { round } = englishExplorersStore.get();
    if (!round || round.phase !== 'done') return;
    advance(completeQuestion(round, false, ''));
  },

  quit(): void {
    update({ screen: 'setup', round: null, outcome: null });
  },
};

export function nextWorldId(worldId: string): string | undefined {
  if (!getWorld(worldId)) return undefined;
  const index = WORLDS.findIndex((world) => world.id === worldId);
  return WORLDS[index + 1]?.id;
}
