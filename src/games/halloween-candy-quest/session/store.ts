/**
 * Trạng thái Halloween Candy Quest: màn đang mở, Teacher Setup, bộ từ, nhân vật / đội và ván đang chơi.
 *
 *   home ─▶ mode ─▶ setup ⇄ vocab
 *                     │
 *                     ▼
 *                characters ─▶ [team] picker ─▶ play ─▶ results ─▶ (PLAY AGAIN / NEW WORD SET / HOME)
 *
 * Một lượt (Phase, session/types.ts): mọi action của ván nhận `turnId` + kiểm tra pha hiện tại, nên chạm hai lần,
 * hẹn giờ cũ chạy muộn hay đổi màn giữa chừng đều không làm cộng kẹo / chuyển lượt hai lần (spec §5.2, §7.1).
 * Kẹo chỉ được cộng ở bước feedback -> reward, đúng một lần mỗi lượt.
 */
import { activeWords, normalizeText } from '@/games/halloween-candy-quest/content/words';
import type { CustomWord } from '@/games/halloween-candy-quest/content/schema';
import { CHARACTERS } from '@/games/halloween-candy-quest/content/world';
import { halloweenCandyQuestManifest } from '@/games/halloween-candy-quest/manifest';
import {
  buildPlan,
  candiesFor,
  checkSetup,
  countOf,
  createRng,
  MAX_ATTEMPTS,
  replacementQuestion,
  usableTypes,
  type SetupCheck,
} from '@/games/halloween-candy-quest/session/rules';
import {
  loadSaved,
  MAX_CUSTOM_WORDS,
  MAX_TEAM_NAME,
  saveCharacters,
  saveSettings,
  saveVocabulary,
  type Vocabulary,
} from '@/games/halloween-candy-quest/session/storage';
import { TEXT } from '@/games/halloween-candy-quest/session/text';
import type {
  Feedback,
  Game,
  Mode,
  PlannedTurn,
  Settings,
  TeamSetup,
  TurnRecord,
} from '@/games/halloween-candy-quest/session/types';
import { canSpeakIn } from '@/games/halloween-candy-quest/session/voice';
import { postSoloResult } from '@/modules/results';
import { events } from '@/modules/analytics';
import { awardGems } from '@/modules/gems';
import { createStore } from '@/core/store/createStore';
import { speech } from '@/core/utils/speech';

export type Screen = 'home' | 'mode' | 'setup' | 'vocab' | 'characters' | 'picker' | 'play' | 'results';

export interface Outcome {
  gemsEarned: number;
  syncId: string | null;
}

export interface HalloweenState {
  screen: Screen;
  settings: Settings;
  vocabulary: Vocabulary;
  soloCharacter: string;
  teams: TeamSetup[];
  /** Đội đi trước (bí ngô quay ở màn picker) */
  firstTeam: number;
  game: Game | null;
  outcome: Outcome | null;
}

const saved = loadSaved();

export const halloweenStore = createStore<HalloweenState>({
  screen: 'home',
  settings: saved.settings,
  vocabulary: saved.vocabulary,
  soloCharacter: saved.soloCharacter,
  teams: saved.teams,
  firstTeam: 0,
  game: null,
  outcome: null,
});

let nextGameId = 1;
/** Ngẫu nhiên cho câu thay thế (Skip Question) — seed theo ván */
let replaceRng = createRng(1);

function update(patch: Partial<HalloweenState>): void {
  halloweenStore.set((state) => ({ ...state, ...patch }));
}

function updateGame(patch: Partial<Game>): void {
  const { game } = halloweenStore.get();
  if (game) update({ game: { ...game, ...patch } });
}

/** Ván đang ở đúng lượt + đúng pha (và không tạm dừng) thì trả về ván, không thì null */
function gameAt(turnId: string, ...phases: Game['phase'][]): Game | null {
  const { game, screen } = halloweenStore.get();
  if (screen !== 'play' || !game || game.paused) return null;
  const current = game.plan[game.turn];
  if (!current || current.turnId !== turnId || !phases.includes(game.phase)) return null;
  return game;
}

export const currentTurn = (game: Game): PlannedTurn => game.plan[game.turn];

/** Từ đang bật (theo bộ từ đã lưu) */
export const selectWords = (state: HalloweenState) =>
  activeWords(state.vocabulary.library, state.vocabulary.custom);

export function setupCheck(state: HalloweenState): SetupCheck {
  return checkSetup(
    state.settings,
    selectWords(state),
    canSpeakIn(state.settings.voiceMode),
    speech.supported,
  );
}

function setVocabulary(vocabulary: Vocabulary): void {
  saveVocabulary(vocabulary);
  update({ vocabulary });
}

function createGame(state: HalloweenState, firstTeam: number, seed: number): Game {
  const { settings } = state;
  const words = selectWords(state);
  const canSpeak = canSpeakIn(settings.voiceMode);
  const team = settings.mode === 'team';
  const id = nextGameId++;
  replaceRng = createRng(seed ^ 0x9e3779b9);
  const teams = team
    ? state.teams.map((setup) => ({ name: setup.name, characterId: setup.characterId, score: 0 }))
    : [{ name: '', characterId: state.soloCharacter, score: 0 }];
  return {
    id,
    settings,
    words,
    canSpeak,
    teams,
    firstTeam: team ? firstTeam : 0,
    plan: buildPlan({
      settings,
      words,
      canSpeak,
      teamCount: teams.length,
      firstTeam,
      rng: createRng(seed),
      gameId: id,
    }),
    turn: 0,
    phase: 'zone',
    attempt: 1,
    feedback: null,
    lastCandies: 0,
    replaced: 0,
    timedOut: false,
    paused: false,
    records: [],
    usedKeys: [],
    startedAt: Date.now(),
  };
}

function finishGame(game: Game): void {
  const firstTry = game.records.filter((record) => record.attempts === 1 && record.candies > 0).length;
  const total = game.records.length;
  const solo = game.settings.mode === 'solo';
  const gemsEarned = awardGems(firstTry);
  let syncId: string | null = null;
  if (solo) {
    syncId = postSoloResult({
      gameId: halloweenCandyQuestManifest.id,
      levelId: game.settings.difficulty,
      correct: firstTry,
      total,
      score: game.teams[0].score,
      durationMs: Math.min(3_600_000, Math.max(0, Date.now() - game.startedAt)),
      endedBy: 'completed',
      details: {
        characterId: game.teams[0].characterId,
        words: game.words.length,
        questions: game.records.map((record) => ({
          type: record.type,
          word: record.targetId,
          attempts: record.attempts,
          candies: record.candies,
        })),
      },
    });
  }
  if (!syncId) events.trackPlay(halloweenCandyQuestManifest.id, solo ? 'solo' : 'class');
  update({ screen: 'results', game, outcome: { gemsEarned, syncId } });
}

/** Sang lượt kế tiếp (đổi khu vực thì chiếu màn giới thiệu khu vực trước) */
function advance(game: Game): void {
  const turn = game.turn + 1;
  if (turn >= game.plan.length) {
    finishGame(game);
    return;
  }
  const zoneChanged = game.plan[turn].zone !== game.plan[game.turn].zone;
  update({
    game: {
      ...game,
      turn,
      phase: zoneChanged ? 'zone' : 'walk',
      attempt: 1,
      feedback: null,
      lastCandies: 0,
      replaced: 0,
      timedOut: false,
    },
  });
}

function judge(game: Game, correct: boolean, timedOut = false): Feedback {
  const feedback: Feedback = correct
    ? 'correct'
    : !timedOut && game.attempt < MAX_ATTEMPTS
      ? 'wrong'
      : 'reveal';
  updateGame({ phase: 'feedback', feedback, timedOut });
  return feedback;
}

export const halloweenActions = {
  goHome(): void {
    update({ screen: 'home', game: null, outcome: null });
  },

  openModes(): void {
    update({ screen: 'mode', game: null, outcome: null });
  },

  chooseMode(mode: Mode): void {
    halloweenActions.updateSettings({ mode });
    update({ screen: 'setup' });
  },

  openSetup(): void {
    update({ screen: 'setup', game: null, outcome: null });
  },

  updateSettings(patch: Partial<Settings>): void {
    const settings = { ...halloweenStore.get().settings, ...patch };
    saveSettings(settings);
    update({ settings });
  },

  // ------------------------------------------------------------ bộ từ

  openVocab(): void {
    update({ screen: 'vocab', game: null, outcome: null });
  },

  setLibraryWord(id: string, on: boolean): void {
    const { vocabulary } = halloweenStore.get();
    const library = vocabulary.library.filter((word) => word !== id);
    setVocabulary({ ...vocabulary, library: on ? [...library, id] : library });
  },

  setAllLibrary(ids: readonly string[]): void {
    setVocabulary({ ...halloweenStore.get().vocabulary, library: [...ids] });
  },

  /** Thêm từ tự tạo; trả về câu báo lỗi (tiếng Anh) hoặc null nếu thêm được */
  addCustomWord(text: string, meaning: string, image: string): string | null {
    const { vocabulary } = halloweenStore.get();
    const clean = text.trim().replace(/\s+/g, ' ');
    if (!clean) return TEXT.wordNeedsText;
    if (!image) return TEXT.wordNeedsPicture;
    if (vocabulary.custom.length >= MAX_CUSTOM_WORDS) return TEXT.tooManyWords;
    const taken = [...activeWords(vocabulary.library, []), ...vocabulary.custom].some(
      (word) => normalizeText(word.text) === normalizeText(clean),
    );
    if (taken) return TEXT.wordExists;
    const word: CustomWord = {
      id: `custom-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
      text: clean,
      meaning: meaning.trim(),
      image,
      enabled: true,
    };
    setVocabulary({ ...vocabulary, custom: [...vocabulary.custom, word] });
    return null;
  },

  setCustomWord(id: string, enabled: boolean): void {
    const { vocabulary } = halloweenStore.get();
    setVocabulary({
      ...vocabulary,
      custom: vocabulary.custom.map((word) => (word.id === id ? { ...word, enabled } : word)),
    });
  },

  removeCustomWord(id: string): void {
    const { vocabulary } = halloweenStore.get();
    setVocabulary({ ...vocabulary, custom: vocabulary.custom.filter((word) => word.id !== id) });
  },

  // ------------------------------------------------------------ nhân vật / đội

  /** Setup hợp lệ -> chọn nhân vật */
  openCharacters(): boolean {
    if (setupCheck(halloweenStore.get()).errors.length > 0) return false;
    update({ screen: 'characters' });
    return true;
  },

  setSoloCharacter(id: string): void {
    const { teams } = halloweenStore.get();
    saveCharacters(id, teams);
    update({ soloCharacter: id });
  },

  setTeamName(index: number, name: string): void {
    const { soloCharacter, teams } = halloweenStore.get();
    const next = teams.map((team, i) =>
      i === index ? { ...team, name: name.slice(0, MAX_TEAM_NAME) } : team,
    );
    saveCharacters(soloCharacter, next);
    update({ teams: next });
  },

  /** Hai đội phải chọn hai nhân vật khác nhau */
  setTeamCharacter(index: number, characterId: string): boolean {
    const { soloCharacter, teams } = halloweenStore.get();
    if (teams.some((team, i) => i !== index && team.characterId === characterId)) return false;
    const next = teams.map((team, i) => (i === index ? { ...team, characterId } : team));
    saveCharacters(soloCharacter, next);
    update({ teams: next });
    return true;
  },

  /** Màn chọn nhân vật xong: solo vào chơi luôn, team sang quay bí ngô chọn đội đi trước */
  confirmCharacters(): void {
    const state = halloweenStore.get();
    if (state.settings.mode === 'solo') {
      halloweenActions.startGame(0);
      return;
    }
    // Tên đội trống -> tên mặc định
    const teams = state.teams.map((team, index) => ({
      ...team,
      name: team.name.trim() || (index === 0 ? 'TEAM PUMPKIN' : 'TEAM GHOST'),
    }));
    saveCharacters(state.soloCharacter, teams);
    update({ teams, screen: 'picker' });
  },

  /** Bí ngô quay: chọn ngẫu nhiên đội đi trước, một lần trước trận */
  pickFirstTeam(random: () => number = Math.random): number {
    const firstTeam = random() < 0.5 ? 0 : 1;
    update({ firstTeam });
    return firstTeam;
  },

  startGame(
    firstTeam = halloweenStore.get().firstTeam,
    seed = Date.now() ^ Math.floor(Math.random() * 1e9),
  ): void {
    const state = halloweenStore.get();
    if (setupCheck(state).errors.length > 0) {
      update({ screen: 'setup' });
      return;
    }
    const game = createGame(state, firstTeam, seed);
    if (game.plan.length === 0) {
      update({ screen: 'setup' });
      return;
    }
    update({ screen: 'play', game, outcome: null });
  },

  playAgain(): void {
    const { settings } = halloweenStore.get();
    if (settings.mode === 'team') update({ screen: 'picker', game: null, outcome: null });
    else halloweenActions.startGame(0);
  },

  /** Kết quả -> sửa bộ từ */
  newWordSet(): void {
    halloweenActions.openVocab();
  },

  // ------------------------------------------------------------ một lượt

  zoneShown(turnId: string): void {
    if (gameAt(turnId, 'zone')) updateGame({ phase: 'walk' });
  },

  arrived(turnId: string): void {
    if (gameAt(turnId, 'walk')) updateGame({ phase: 'knock' });
  },

  /** Chạm cửa: chỉ nhận một lần */
  knock(turnId: string): boolean {
    if (!gameAt(turnId, 'knock')) return false;
    updateGame({ phase: 'knocking' });
    return true;
  },

  doorOpened(turnId: string): void {
    if (gameAt(turnId, 'knocking')) updateGame({ phase: 'greeting' });
  },

  greeted(turnId: string): void {
    if (gameAt(turnId, 'greeting')) updateGame({ phase: 'question' });
  },

  /** Chọn đáp án (Listen & Choose / Find the Object / Look & Listen) */
  answer(turnId: string, wordId: string): Feedback | null {
    const game = gameAt(turnId, 'question');
    if (!game) return null;
    return judge(game, wordId === currentTurn(game).question.targetId);
  },

  /** Match the Pairs: kiểm tra cả thử thách khi đã ghép đủ 2 cặp (`pairs`: id hình -> id loa) */
  answerPairs(turnId: string, pairs: Record<string, string>): Feedback | null {
    const game = gameAt(turnId, 'question');
    const question = game ? currentTurn(game).question : null;
    if (!game || !question || question.type !== 'match_pairs') return null;
    if (Object.keys(pairs).length < question.options.length) return null;
    return judge(
      game,
      question.options.every((id) => pairs[id] === id),
    );
  },

  timeUp(turnId: string): void {
    const game = gameAt(turnId, 'question');
    if (game) judge(game, false, true);
  },

  /** Hết phản hồi: sai lần 1 -> thử lại; đúng / hiện đáp án -> nhận kẹo (cộng điểm đúng một lần ở đây) */
  feedbackDone(turnId: string): void {
    const game = gameAt(turnId, 'feedback');
    if (!game) return;
    if (game.feedback === 'wrong') {
      updateGame({ phase: 'question', attempt: game.attempt + 1, feedback: null });
      return;
    }
    const planned = currentTurn(game);
    const candies = candiesFor(game.attempt, game.feedback === 'correct');
    const record: TurnRecord = {
      turnId: planned.turnId,
      team: planned.team,
      questionId: planned.question.id,
      type: planned.question.type,
      targetId: planned.question.targetId,
      attempts: game.attempt,
      candies,
      replaced: game.replaced,
      timedOut: game.timedOut,
    };
    updateGame({
      phase: 'reward',
      lastCandies: candies,
      teams: game.teams.map((team, index) =>
        index === planned.team ? { ...team, score: team.score + candies } : team,
      ),
      records: [...game.records, record],
    });
  },

  /** Hết hiệu ứng nhận kẹo: solo tự sang lượt sau; team chờ giáo viên bấm NEXT TURN */
  rewardDone(turnId: string): void {
    const game = gameAt(turnId, 'reward');
    if (!game) return;
    const last = game.turn + 1 >= game.plan.length;
    if (game.settings.mode === 'team' && !last) updateGame({ phase: 'turn_end' });
    else advance(game);
  },

  nextTurn(turnId: string): void {
    const game = gameAt(turnId, 'turn_end');
    if (game) advance(game);
  },

  /**
   * Skip Question: thay câu lỗi / không phù hợp ngay trong lượt — giữ đội, lượt và cơ hội nhận đủ kẹo.
   * Chỉ dùng được trước khi lượt có kết quả. Trả về false nếu không tạo được câu khác.
   */
  skipQuestion(): boolean {
    const { game } = halloweenStore.get();
    if (!game || game.paused) return false;
    const replaceable =
      ['knock', 'knocking', 'greeting', 'question'].includes(game.phase) ||
      (game.phase === 'feedback' && game.feedback === 'wrong');
    if (!replaceable) return false;
    const planned = currentTurn(game);
    const question = replacementQuestion(
      planned.question,
      game.words,
      usableTypes(game.settings, game.words, game.canSpeak),
      countOf(planned.question),
      replaceRng,
      `${planned.question.id}-r${game.replaced + 1}`,
    );
    if (!question) return false;
    const plan = game.plan.map((entry, index) => (index === game.turn ? { ...entry, question } : entry));
    updateGame({
      plan,
      replaced: game.replaced + 1,
      attempt: 1,
      feedback: null,
      phase: game.phase === 'feedback' ? 'question' : game.phase,
    });
    return true;
  },

  setPaused(paused: boolean): void {
    const { game } = halloweenStore.get();
    if (game && game.paused !== paused) updateGame({ paused });
  },

  quit(): void {
    update({ screen: 'home', game: null, outcome: null });
  },
};

export const characterName = (id: string): string =>
  CHARACTERS.find((character) => character.id === id)?.name ?? '';
