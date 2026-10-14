/**
 * Luật của một lượt chơi (Solo hoặc Classroom) — thuần TypeScript, không phụ thuộc Phaser/React.
 * Scene gọi `answer()` / `timeout()` rồi diễn hiệu ứng theo kết quả trả về, và đẩy state machine
 * qua từng bước (feeding -> eating -> reward -> next-question) khi hiệu ứng xong.
 *
 * Solo: chọn sai -> nhẹ nhàng chọn lại (lựa chọn sai bị làm mờ); sai 2 lần thì gợi ý đáp án.
 * Classroom: đội A / B luân phiên mỗi câu, mỗi đội 1 lần trả lời; sai thì (nếu bật STEAL)
 * đội kia được giành quyền trả lời, không thì hiện đáp án và sang câu mới.
 */
import type { QuestionDeck } from '@/games/food-stream/session/questions';
import { RoundStateMachine } from '@/games/food-stream/session/roundState';
import { rewardFor, SCORING, starsFor, type AnswerReward } from '@/games/food-stream/session/scoring';
import type {
  GameMode,
  Question,
  QuestionRecord,
  RoundResult,
  Team,
  TeamId,
  TeamScore,
} from '@/games/food-stream/session/types';
import { pickRandom } from '@/core/utils/random';

/** Sai ngần này lần (Solo) thì gợi ý đáp án */
const HINT_AFTER_WRONG = 2;

export interface RoundConfig {
  mode: GameMode;
  /** Solo: 1 đội; Classroom: 2 đội */
  teams: Team[];
  questionCount: number;
  steal: boolean;
  firstTeam: TeamId;
}

export type AnswerOutcome =
  | { kind: 'ignored' }
  /** Ghép từ: đúng một chữ, từ chưa xong */
  | { kind: 'progress'; choiceId: string; slotIndex: number }
  | {
      kind: 'correct';
      choiceId: string;
      /** Ghép từ / điền chữ: ô vừa được điền */
      slotIndex?: number;
      team: Team;
      reward: AnswerReward;
      firstTry: boolean;
      streak: number;
    }
  | {
      kind: 'wrong';
      /** null = hết giờ trả lời */
      choiceId: string | null;
      team: Team;
      /** retry: chọn lại · steal: đội kia trả lời · reveal: hiện đáp án, sang câu mới */
      next: 'retry' | 'steal' | 'reveal';
      /** Lựa chọn bị làm mờ (không còn chọn được) */
      removedChoiceId?: string;
      /** Solo sai nhiều lần: lựa chọn cần gợi ý */
      hintChoiceId?: string;
    };

interface TeamState {
  team: Team;
  score: number;
  correct: number;
  streak: number;
  bestStreak: number;
}

export class RoundController {
  readonly machine = new RoundStateMachine();
  private readonly teams: TeamState[];
  private readonly records: QuestionRecord[] = [];
  private readonly removed = new Set<string>();
  private question: Question | null = null;
  private index = -1;
  private wrongCount = 0;
  private stolen = false;
  private answering: TeamState;
  /** Ô chữ tiếp theo cần điền (câu ghép từ / điền chữ thiếu) */
  private slot = 0;
  private viewerCount: number = SCORING.viewers.start;
  private heartCount = 0;

  constructor(
    private readonly config: RoundConfig,
    private readonly deck: QuestionDeck,
  ) {
    this.teams = config.teams.map((team) => ({ team, score: 0, correct: 0, streak: 0, bestStreak: 0 }));
    this.answering = this.teams[0];
  }

  // -------------------------------------------------------------------------
  // Trạng thái đọc được
  // -------------------------------------------------------------------------
  get current(): Question | null {
    return this.question;
  }

  /** Câu thứ mấy (từ 1) / tổng số câu */
  get progress(): { index: number; total: number } {
    return { index: this.index + 1, total: this.config.questionCount };
  }

  /** Đội đang trả lời (có thể là đội giành quyền) */
  get answeringTeam(): Team {
    return this.answering.team;
  }

  get scores(): readonly TeamScore[] {
    return this.teams.map(({ team, score, correct, bestStreak }) => ({ team, score, correct, bestStreak }));
  }

  get streak(): number {
    return this.answering.streak;
  }

  get viewers(): number {
    return this.viewerCount;
  }

  get hearts(): number {
    return this.heartCount;
  }

  /** Ô chữ tiếp theo cần điền */
  get slotIndex(): number {
    return this.slot;
  }

  isRemoved(choiceId: string): boolean {
    return this.removed.has(choiceId);
  }

  // -------------------------------------------------------------------------
  // Luồng câu hỏi
  // -------------------------------------------------------------------------
  /** Ra câu tiếp theo; null khi đã hết câu */
  nextQuestion(): Question | null {
    if (this.index + 1 >= this.config.questionCount) return null;
    this.index += 1;
    this.question = this.deck.next();
    this.removed.clear();
    this.wrongCount = 0;
    this.stolen = false;
    this.slot = this.firstOpenSlot(0);
    this.answering = this.teams[this.turnTeamIndex()];
    return this.question;
  }

  answer(choiceId: string): AnswerOutcome {
    const question = this.question;
    if (!question || !this.machine.is('awaiting-input') || this.removed.has(choiceId))
      return { kind: 'ignored' };
    const choice = question.choices.find((item) => item.id === choiceId);
    if (!choice) return { kind: 'ignored' };

    if (!this.isCorrect(question, choiceId)) {
      this.machine.go('wrong');
      return this.handleWrong(question, choiceId);
    }

    this.machine.go('correct');
    const slotIndex = question.slots ? this.slot : undefined;
    this.removed.add(choiceId);
    if (question.slots) {
      this.slot = this.firstOpenSlot(this.slot + 1);
      if (this.slot < question.slots.length) return { kind: 'progress', choiceId, slotIndex: slotIndex! };
    }
    return this.handleCorrect(question, choiceId, slotIndex);
  }

  /** Hết giờ trả lời của lượt (Classroom) — như trả lời sai */
  timeout(): AnswerOutcome {
    const question = this.question;
    if (!question || !this.machine.is('awaiting-input')) return { kind: 'ignored' };
    this.machine.go('wrong');
    return this.handleWrong(question, null);
  }

  /** Lựa chọn / ô chữ đúng tiếp theo (để gợi ý hoặc hiện đáp án) */
  expectedChoiceId(): string | undefined {
    const question = this.question;
    if (!question) return undefined;
    if (!question.slots) return question.correctChoiceIds[0];
    const letter = question.slots[this.slot]?.letter;
    return question.choices.find((choice) => choice.label === letter && !this.removed.has(choice.id))?.id;
  }

  /** Kết thúc lượt (hết câu hoặc hết giờ) */
  finish(endedBy: RoundResult['endedBy']): RoundResult {
    if (!this.machine.is('complete')) this.machine.go('complete');
    const firstTry = this.records.filter((record) => record.firstTry).length;
    const perfect = endedBy === 'questions' && this.records.length > 0 && firstTry === this.records.length;
    if (perfect) this.viewerCount += SCORING.viewers.perfect;
    return {
      records: [...this.records],
      teams: this.scores.map((score) => ({ ...score })),
      viewers: this.viewerCount,
      hearts: this.heartCount,
      stars: this.config.mode === 'solo' ? starsFor(firstTry, this.config.questionCount) : 0,
      perfect,
      endedBy,
    };
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------
  private turnTeamIndex(): number {
    if (this.teams.length === 1) return 0;
    return (this.config.firstTeam + this.index) % this.teams.length;
  }

  private firstOpenSlot(from: number): number {
    const slots = this.question?.slots ?? [];
    let index = from;
    while (index < slots.length && slots[index].given) index += 1;
    return index;
  }

  private isCorrect(question: Question, choiceId: string): boolean {
    if (!question.slots) return question.correctChoiceIds.includes(choiceId);
    const choice = question.choices.find((item) => item.id === choiceId);
    return choice?.label === question.slots[this.slot]?.letter;
  }

  private handleCorrect(question: Question, choiceId: string, slotIndex?: number): AnswerOutcome {
    const state = this.answering;
    const firstTry = this.wrongCount === 0 && !this.stolen;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.correct += 1;
    const reward = rewardFor(firstTry, state.streak);
    state.score += reward.points;
    this.viewerCount += reward.viewers;
    this.heartCount +=
      SCORING.hearts.min + Math.floor(Math.random() * (SCORING.hearts.max - SCORING.hearts.min + 1));
    this.record(question, state.team.id, firstTry, reward.points);
    return { kind: 'correct', choiceId, slotIndex, team: state.team, reward, firstTry, streak: state.streak };
  }

  private handleWrong(question: Question, choiceId: string | null): AnswerOutcome {
    const team = this.answering.team;
    this.answering.streak = 0;
    this.wrongCount += 1;

    // Chỉ làm mờ lựa chọn sai nếu sau này không cần tới (ghép từ: chữ đúng nhưng sai thứ tự)
    const neededLater = choiceId !== null && question.correctChoiceIds.includes(choiceId);
    const removedChoiceId = choiceId !== null && !neededLater ? choiceId : undefined;
    if (removedChoiceId) this.removed.add(removedChoiceId);

    if (this.config.mode === 'solo') {
      const hintChoiceId = this.wrongCount >= HINT_AFTER_WRONG ? this.expectedChoiceId() : undefined;
      return { kind: 'wrong', choiceId, team, next: 'retry', removedChoiceId, hintChoiceId };
    }
    if (this.config.steal && !this.stolen) {
      this.stolen = true;
      this.answering = this.teams.find((state) => state !== this.answering) ?? this.answering;
      return { kind: 'wrong', choiceId, team, next: 'steal', removedChoiceId };
    }
    this.record(question, null, false, 0);
    return { kind: 'wrong', choiceId, team, next: 'reveal', removedChoiceId };
  }

  private record(question: Question, answeredBy: TeamId | null, firstTry: boolean, points: number): void {
    const label = question.word?.word ?? question.sound?.grapheme ?? '';
    this.records.push({
      targetId: question.targetId,
      mode: question.mode,
      label,
      picture: question.word?.imageAsset,
      answeredBy,
      firstTry,
      points,
    });
    if (!firstTry) this.deck.requeue(question);
  }
}

/** Đội đi trước ngẫu nhiên (plan §5.2) */
export const randomFirstTeam = (teams: readonly Team[]): TeamId => pickRandom(teams).id;
