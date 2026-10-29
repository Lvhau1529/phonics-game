/**
 * Luật Halloween Candy Quest (thuần TS, không phụ thuộc React): chia lượt theo khu vực, chọn dạng thử thách,
 * sinh câu hỏi + lịch câu hỏi cả ván, thay câu lỗi, chấm kẹo, kiểm tra Setup trước khi Start.
 * Ngẫu nhiên qua `Rng` có seed để test được và để mỗi ván có seed riêng (spec §15).
 */
import { normalizeText, type VocabWord } from '@/games/halloween-candy-quest/content/words';
import { HOUSE_SLOTS, ZONE_COUNT } from '@/games/halloween-candy-quest/content/world';
import type {
  Difficulty,
  PlannedTurn,
  Question,
  QuestionType,
  Settings,
  Team,
} from '@/games/halloween-candy-quest/session/types';
import { QUESTION_TYPES } from '@/games/halloween-candy-quest/session/types';

export const TURN_OPTIONS = { solo: [6, 8, 10, 12], team: [8, 12, 16, 20] } as const;

export const DEFAULT_SETTINGS: Settings = {
  mode: 'team',
  soloTurns: 8,
  teamTurns: 12,
  difficulty: 'easy',
  questionTypes: [...QUESTION_TYPES],
  timerSeconds: 0,
  voiceMode: 'both',
  showLiveScore: true,
};

/** Kẹo: đúng ngay lần 1 / đúng lần 2 (sau gợi ý) / chưa đúng — không bao giờ trừ */
export const CANDIES = { firstTry: 2, secondTry: 1, missed: 0 } as const;
export const MAX_ATTEMPTS = 2;

export function candiesFor(attempt: number, correct: boolean): number {
  if (!correct) return CANDIES.missed;
  return attempt <= 1 ? CANDIES.firstTry : CANDIES.secondTry;
}

export const totalTurns = (settings: Settings): number =>
  settings.mode === 'solo' ? settings.soloTurns : settings.teamTurns;

// ---------------------------------------------------------------- khu vực

/** Số lượt mỗi khu vực, chia gần đều từ trái sang phải: 8 -> 3/3/2, 12 -> 4/4/4, 10 -> 4/3/3 */
export function zoneSizes(total: number, zones = ZONE_COUNT): number[] {
  const base = Math.floor(total / zones);
  const rest = total % zones;
  return Array.from({ length: zones }, (_, index) => base + (index < rest ? 1 : 0));
}

/** Khu vực của lượt (0-based) — mở theo số lượt đã chơi, không theo số câu đúng */
export function zoneOfTurn(turn: number, total: number): number {
  let end = 0;
  const sizes = zoneSizes(total);
  for (let zone = 0; zone < sizes.length; zone += 1) {
    end += sizes[zone];
    if (turn < end) return zone;
  }
  return sizes.length - 1;
}

/** Thứ tự lượt trong khu vực -> ngôi nhà (0–3, quay vòng nếu khu vực có hơn 4 lượt) */
export function houseOfTurn(turn: number, total: number): number {
  const zone = zoneOfTurn(turn, total);
  const start = zoneSizes(total)
    .slice(0, zone)
    .reduce((sum, size) => sum + size, 0);
  return (turn - start) % HOUSE_SLOTS.length;
}

// ---------------------------------------------------------------- ngẫu nhiên có seed

export type Rng = () => number;

/** mulberry32 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWith<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ---------------------------------------------------------------- dạng thử thách

/** Trọng số chọn dạng theo khu vực (spec §3, §6.5): khu 1 ưu tiên Listen & Choose, khu 3 cân bằng */
export const ZONE_WEIGHTS: readonly Record<QuestionType, number>[] = [
  { listen_choose: 70, find_object: 30, look_listen: 0, match_pairs: 0 },
  { listen_choose: 40, find_object: 30, look_listen: 30, match_pairs: 0 },
  { listen_choose: 35, find_object: 25, look_listen: 20, match_pairs: 20 },
];
/** Khi trọng số của khu vực không còn dạng nào khả dụng */
export const BASE_WEIGHTS: Record<QuestionType, number> = {
  listen_choose: 45,
  find_object: 25,
  look_listen: 20,
  match_pairs: 10,
};

export type TypeIssue = 'words' | 'scene' | 'voice';

/** Dạng này có đủ tài nguyên không (lý do nếu không) */
export function typeIssue(
  type: QuestionType,
  words: readonly VocabWord[],
  canSpeak: boolean,
): TypeIssue | null {
  if (words.length < 2) return 'words';
  if (type === 'find_object' && words.filter((word) => word.sceneEligible).length < 2) return 'scene';
  if ((type === 'look_listen' || type === 'match_pairs') && !canSpeak) return 'voice';
  return null;
}

export function usableTypes(
  settings: Settings,
  words: readonly VocabWord[],
  canSpeak: boolean,
): QuestionType[] {
  return settings.questionTypes.filter((type) => typeIssue(type, words, canSpeak) === null);
}

function pickType(types: readonly QuestionType[], zone: number, rng: Rng): QuestionType {
  for (const weights of [ZONE_WEIGHTS[zone] ?? BASE_WEIGHTS, BASE_WEIGHTS]) {
    const total = types.reduce((sum, type) => sum + weights[type], 0);
    if (total <= 0) continue;
    let roll = rng() * total;
    for (const type of types) {
      roll -= weights[type];
      if (roll < 0) return type;
    }
  }
  return types[Math.floor(rng() * types.length)];
}

/**
 * Số lựa chọn: Easy 2, Normal 3, Mixed tăng dần theo khu vực (khu 1: 2, khu 2: xen kẽ, khu 3: 3).
 * Không bao giờ tạo 3 lựa chọn khi chỉ có 2 từ.
 */
export function choiceCount(difficulty: Difficulty, step: number, zone: number, available: number): number {
  let count = 2;
  if (difficulty === 'normal') count = 3;
  if (difficulty === 'mixed') count = zone === 0 ? 2 : zone === 1 ? 2 + (step % 2) : 3;
  return Math.max(2, Math.min(count, available));
}

// ---------------------------------------------------------------- câu hỏi

/** Khoá so trùng nguyên câu: (dạng, từ đích, bộ đáp án) */
export const questionKey = (question: Question): string =>
  `${question.type}:${question.targetId}:${[...question.options].sort().join(',')}`;

/** Từ có thể làm đáp án nhiễu cho `target`: khác id và khác chữ (không hai đáp án đọc giống nhau) */
function distractorsFor(target: VocabWord, pool: readonly VocabWord[], type: QuestionType): VocabWord[] {
  const text = normalizeText(target.text);
  return pool.filter(
    (word) =>
      word.id !== target.id &&
      normalizeText(word.text) !== text &&
      (type !== 'find_object' || word.sceneEligible),
  );
}

/**
 * Câu hỏi cho từ đích. `count` = số lựa chọn (Find the Object đặt thêm 1 vật vào cảnh cho đủ "cảnh");
 * Match the Pairs luôn 2 cặp.
 */
export function makeQuestion(
  type: QuestionType,
  target: VocabWord,
  pool: readonly VocabWord[],
  count: number,
  rng: Rng,
  id: string,
): Question {
  const others = shuffleWith(distractorsFor(target, pool, type), rng);
  if (type === 'match_pairs') {
    const pair = [target.id, others[0].id];
    return { id, type, targetId: target.id, options: shuffleWith(pair, rng), sounds: shuffleWith(pair, rng) };
  }
  const size = type === 'find_object' ? count + 1 : count;
  const options = shuffleWith([target.id, ...others.slice(0, size - 1).map((word) => word.id)], rng);
  return { id, type, targetId: target.id, options };
}

/** Bộ bài từ đích: rút lần lượt, hết thì xáo lại — các từ lặp lại sau một khoảng, không liên tiếp */
export class TargetDeck {
  private deck: VocabWord[] = [];

  constructor(
    private readonly words: readonly VocabWord[],
    private readonly rng: Rng,
  ) {}

  next(type: QuestionType, avoid: ReadonlySet<string>): VocabWord {
    const fits = (word: VocabWord) =>
      (type !== 'find_object' || word.sceneEligible) && distractorsFor(word, this.words, type).length > 0;
    const take = (strict: boolean): VocabWord | undefined => {
      const index = this.deck.findIndex((word) => fits(word) && (!strict || !avoid.has(word.id)));
      return index >= 0 ? this.deck.splice(index, 1)[0] : undefined;
    };
    let word = take(true);
    if (!word) {
      // Bài còn lại (nếu có) vẫn rút trước, bộ mới xếp sau
      this.deck.push(...shuffleWith(this.words, this.rng));
      word = take(true) ?? take(false);
    }
    return word ?? this.words.find(fits) ?? this.words[0];
  }
}

export interface PlanInput {
  settings: Settings;
  words: readonly VocabWord[];
  canSpeak: boolean;
  teamCount: number;
  firstTeam: number;
  rng: Rng;
  gameId: number;
}

/**
 * Lịch câu hỏi cả ván (spec §11). Team: lượt của A và lượt kế của B là một "cặp" cùng dạng + cùng số lựa chọn,
 * khác từ đích nếu đủ từ; không lặp nguyên câu của lượt ngay trước.
 */
export function buildPlan({
  settings,
  words,
  canSpeak,
  teamCount,
  firstTeam,
  rng,
  gameId,
}: PlanInput): PlannedTurn[] {
  const total = totalTurns(settings);
  const types = usableTypes(settings, words, canSpeak);
  if (types.length === 0) return [];
  const deck = new TargetDeck(words, rng);
  const used = new Set<string>();
  const plan: PlannedTurn[] = [];
  let type: QuestionType = types[0];
  let count = 2;

  for (let turn = 0; turn < total; turn += 1) {
    const zone = zoneOfTurn(turn, total);
    const solo = teamCount === 1;
    const step = solo ? turn : Math.floor(turn / 2);
    if (solo || turn % 2 === 0) {
      type = pickType(types, zone, rng);
      const available =
        type === 'find_object' ? words.filter((word) => word.sceneEligible).length : words.length;
      count = choiceCount(settings.difficulty, step, zone, available);
    }
    const avoid = new Set(plan.slice(-2).map((entry) => entry.question.targetId));
    const question = uniqueQuestion(type, deck, avoid, words, count, rng, `${gameId}-q${turn}`, used);
    plan.push({
      turnId: `${gameId}-t${turn}`,
      team: solo ? 0 : (firstTeam + turn) % 2,
      zone,
      house: houseOfTurn(turn, total),
      question,
    });
  }
  return plan;
}

function uniqueQuestion(
  type: QuestionType,
  deck: TargetDeck,
  avoid: ReadonlySet<string>,
  words: readonly VocabWord[],
  count: number,
  rng: Rng,
  id: string,
  used: Set<string>,
): Question {
  let question = makeQuestion(type, deck.next(type, avoid), words, count, rng, id);
  for (let tries = 0; tries < 4 && used.has(questionKey(question)); tries += 1) {
    question = makeQuestion(type, deck.next(type, avoid), words, count, rng, id);
  }
  used.add(questionKey(question));
  return question;
}

/**
 * Skip Question (giáo viên thay câu lỗi / không phù hợp): câu mới cùng dạng (không được thì Listen & Choose),
 * khác từ đích — giữ nguyên lượt, đội và cơ hội nhận kẹo. Trả về null nếu không tạo được câu khác.
 */
export function replacementQuestion(
  current: Question,
  words: readonly VocabWord[],
  types: readonly QuestionType[],
  difficultyCount: number,
  rng: Rng,
  id: string,
): Question | null {
  const candidates: QuestionType[] = [current.type, ...types.filter((type) => type !== current.type)];
  if (!candidates.includes('listen_choose') && words.length >= 2) candidates.push('listen_choose');
  for (const type of candidates) {
    const targets = shuffleWith(
      words.filter(
        (word) =>
          word.id !== current.targetId &&
          (type !== 'find_object' || word.sceneEligible) &&
          distractorsFor(word, words, type).length > 0,
      ),
      rng,
    );
    if (targets.length > 0) return makeQuestion(type, targets[0], words, difficultyCount, rng, id);
  }
  return null;
}

/** Số lựa chọn của câu (Find the Object có thêm 1 vật trang trí) — để câu thay thế giữ đúng độ khó */
export const countOf = (question: Question): number =>
  question.type === 'find_object' ? question.options.length - 1 : question.options.length;

// ---------------------------------------------------------------- giỏ kẹo & kết quả

export function basketLevel(score: number, maxScore: number): 'empty' | 'half' | 'full' {
  if (score <= 0) return 'empty';
  return score >= maxScore * 0.6 ? 'full' : 'half';
}

/** Đội nhiều kẹo hơn; hoà -> null */
export function leader(teams: readonly Team[]): number | null {
  if (teams.length < 2 || teams[0].score === teams[1].score) return null;
  return teams[0].score > teams[1].score ? 0 : 1;
}

// ---------------------------------------------------------------- kiểm tra trước khi Start (spec §10.5)

export interface SetupCheck {
  /** Chặn Start */
  errors: string[];
  /** Vẫn chơi được, báo giáo viên biết */
  warnings: string[];
}

export const TYPE_LABELS: Record<QuestionType, string> = {
  listen_choose: 'LISTEN & CHOOSE',
  find_object: 'FIND THE OBJECT',
  look_listen: 'LOOK & LISTEN',
  match_pairs: 'MATCH THE PAIRS',
};

export function checkSetup(
  settings: Settings,
  words: readonly VocabWord[],
  canSpeak: boolean,
  speechSupported: boolean,
): SetupCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (words.length < 2) errors.push('Choose at least 2 different words.');
  if (settings.questionTypes.length === 0) errors.push('Turn on at least one challenge type.');

  for (const type of settings.questionTypes) {
    const issue = typeIssue(type, words, canSpeak);
    if (!issue || issue === 'words') continue;
    if (issue === 'scene') warnings.push(`${TYPE_LABELS[type]} needs 2+ library words — it will be skipped.`);
    if (issue === 'voice') warnings.push(`${TYPE_LABELS[type]} needs the game voice — it will be skipped.`);
  }
  if (
    words.length >= 2 &&
    settings.questionTypes.length > 0 &&
    usableTypes(settings, words, canSpeak).length === 0
  ) {
    errors.push('No challenge type can be played with these words and voice settings.');
  }
  if (words.length === 2 && settings.difficulty !== 'easy') {
    warnings.push('Only 2 words: every question will have 2 choices.');
  }
  if (words.length >= 2 && words.length < totalTurns(settings)) {
    warnings.push(`${words.length} words for ${totalTurns(settings)} turns: some words will repeat.`);
  }
  if (settings.voiceMode !== 'teacher' && !speechSupported) {
    warnings.push('This browser has no game voice: the teacher reads the words aloud.');
  }
  return { errors, warnings };
}
