/**
 * Luật một lượt chơi (GAMEPLAY_PHONICS_V2.md §4, §7) — thuần TS, scene chỉ gọi và diễn hiệu ứng:
 *   - ăn đúng: điểm (×2 từ chuỗi 3, ×3 từ chuỗi 5), +1 Growth; ăn nhầm: KHÔNG mất tim, chỉ mất chuỗi
 *   - Growth đủ mốc -> cá lớn thêm một cỡ (3 cỡ); đủ `correctToClear` câu đúng -> qua màn
 *   - độ khó thích ứng: chuỗi 5 câu đúng -> thêm 1 cá (tới maxChoices) và bơi nhanh hơn chút;
 *     nhầm 2 lần liên tiếp -> bớt 1 cá, bật gợi ý, cá săn mồi chậm lại; tỉ lệ đúng < 70% -> tối đa 3 cá
 *   - cấp vần: ăn đúng ngay RHYME_CHAIN từ cùng vần liền nhau = RHYME COMBO (+điểm thưởng)
 *   - tim chỉ mất khi bị cá săn mồi cắn (không phạt lỗi phonics)
 */
import type { LevelDef } from '@/games/phonics-ocean/content/schema';
import { RHYME_CHAIN } from '@/games/phonics-ocean/session/questions';
import type { EndReason, RoundResult, WordRecord } from '@/games/phonics-ocean/session/types';

export const RULES = {
  hearts: 3,
  points: { firstTry: 100, retry: 50, rhymeCombo: 200, powerUp: 50 },
  combos: [
    { streak: 5, multiplier: 3 },
    { streak: 3, multiplier: 2 },
  ],
  /** Mốc lớn lên theo phần trăm số câu cần để qua màn */
  growthTiers: [1 / 3, 2 / 3],
  minChoices: 2,
  /** Cá nhiều nhất khi bé đang chơi chưa tốt */
  struggleChoices: 3,
  struggleAccuracy: 0.7,
  /** Cần ít nhất ngần này lần ăn mới xét tỉ lệ đúng */
  struggleMinAttempts: 5,
  levelUpStreak: 5,
  hintAfterWrong: 2,
  speedStep: 0.06,
  maxSpeedBoost: 0.24,
  /** 3 sao khi tỉ lệ đúng ≥ ngần này (2 sao theo mastery gate của cấp) */
  threeStarAccuracy: 0.9,
  bonusSeconds: 10,
} as const;

export function comboMultiplier(streak: number): number {
  return RULES.combos.find((combo) => streak >= combo.streak)?.multiplier ?? 1;
}

/** Cỡ cá (1–3) theo số câu đúng */
export function tierFor(correct: number, correctToClear: number): number {
  return 1 + RULES.growthTiers.filter((ratio) => correct >= Math.round(correctToClear * ratio)).length;
}

export function starsFor(cleared: boolean, accuracy: number, minAccuracy: number): number {
  if (!cleared) return 0;
  if (accuracy >= RULES.threeStarAccuracy) return 3;
  if (accuracy >= minAccuracy) return 2;
  return 1;
}

export interface CorrectOutcome {
  points: number;
  multiplier: number;
  /** Vừa lớn thêm một cỡ */
  grew: boolean;
  /** Đủ số câu đúng để qua màn */
  cleared: boolean;
  /** Thêm cá ở đề sau (chuỗi đúng) */
  harder: boolean;
  /** Cấp vần: vừa đủ chuỗi cùng vần */
  rhymeCombo: boolean;
}

export interface WrongOutcome {
  /** Bật gợi ý (cá đúng phát sáng) */
  hint: boolean;
  /** Bớt cá ở đề sau */
  easier: boolean;
}

export class RoundState {
  score = 0;
  correct = 0;
  attempts = 0;
  streak = 0;
  bestStreak = 0;
  wrongStreak = 0;
  hearts: number = RULES.hearts;
  choices: number;
  speedBoost = 0;
  hint = false;
  /** Đề hiện tại đã ăn nhầm chưa */
  private missedCurrent = false;
  private rhyme = { target: '', count: 0 };
  private readonly words = new Map<string, WordRecord>();

  constructor(private readonly level: LevelDef) {
    this.choices = level.startChoices;
  }

  get tier(): number {
    return tierFor(this.correct, this.level.correctToClear);
  }

  get accuracy(): number {
    return this.attempts === 0 ? 0 : this.correct / this.attempts;
  }

  /** Tiến độ Growth trong cỡ hiện tại (0–1) — thanh Growth trên HUD */
  get growth(): number {
    const { correctToClear } = this.level;
    const marks = [
      0,
      ...RULES.growthTiers.map((ratio) => Math.round(correctToClear * ratio)),
      correctToClear,
    ];
    const tier = this.tier;
    const from = marks[tier - 1];
    const to = marks[tier];
    return Math.min(1, (this.correct - from) / Math.max(1, to - from));
  }

  get cleared(): boolean {
    return this.correct >= this.level.correctToClear;
  }

  /** Số cá cho đề sau */
  get choiceCount(): number {
    const struggling = this.attempts >= RULES.struggleMinAttempts && this.accuracy < RULES.struggleAccuracy;
    return struggling ? Math.min(this.choices, RULES.struggleChoices) : this.choices;
  }

  startQuestion(): void {
    this.missedCurrent = false;
  }

  answerCorrect(word: string, targetId: string): CorrectOutcome {
    const tierBefore = this.tier;
    const firstTry = !this.missedCurrent;
    const rhymeCombo = this.trackRhyme(targetId, firstTry);
    this.attempts += 1;
    this.correct += 1;
    this.streak += 1;
    this.wrongStreak = 0;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.hint = false;

    const multiplier = comboMultiplier(this.streak);
    const base = firstTry ? RULES.points.firstTry : RULES.points.retry;
    const points = base * multiplier + (rhymeCombo ? RULES.points.rhymeCombo : 0);
    this.score += points;

    const seen = this.words.get(word);
    this.words.set(word, { word, firstTry: firstTry || (seen?.firstTry ?? false) });

    let harder = false;
    if (this.streak % RULES.levelUpStreak === 0) {
      harder = this.choices < this.level.maxChoices;
      this.choices = Math.min(this.level.maxChoices, this.choices + 1);
      this.speedBoost = Math.min(RULES.maxSpeedBoost, this.speedBoost + RULES.speedStep);
    }
    return { points, multiplier, grew: this.tier > tierBefore, cleared: this.cleared, harder, rhymeCombo };
  }

  private trackRhyme(targetId: string, firstTry: boolean): boolean {
    if (this.level.mode !== 'rime') return false;
    if (!firstTry) {
      this.rhyme = { target: targetId, count: 0 };
      return false;
    }
    const count = this.rhyme.target === targetId ? this.rhyme.count + 1 : 1;
    this.rhyme = { target: targetId, count: count >= RHYME_CHAIN ? 0 : count };
    return count >= RHYME_CHAIN;
  }

  answerWrong(): WrongOutcome {
    this.attempts += 1;
    this.streak = 0;
    this.wrongStreak += 1;
    this.missedCurrent = true;
    this.rhyme.count = 0;
    if (this.wrongStreak < RULES.hintAfterWrong) return { hint: this.hint, easier: false };
    this.hint = true;
    const easier = this.choices > RULES.minChoices;
    this.choices = Math.max(RULES.minChoices, this.choices - 1);
    this.speedBoost = Math.max(0, this.speedBoost - RULES.speedStep);
    return { hint: true, easier };
  }

  /** Bị cá săn mồi cắn; trả về số tim còn lại */
  loseHeart(): number {
    this.hearts = Math.max(0, this.hearts - 1);
    return this.hearts;
  }

  gainHeart(): void {
    this.hearts = Math.min(RULES.hearts, this.hearts + 1);
  }

  addBonus(points: number): void {
    this.score += points;
  }

  /** Bé đang gặp khó (nhầm liên tiếp) -> cá săn mồi chậm lại */
  get predatorsCalm(): boolean {
    return this.wrongStreak >= RULES.hintAfterWrong;
  }

  finish(endedBy: EndReason): RoundResult {
    const cleared = this.cleared;
    const accuracy = this.accuracy;
    return {
      levelId: this.level.id,
      endedBy,
      cleared,
      score: this.score,
      correct: this.correct,
      attempts: this.attempts,
      accuracy,
      bestStreak: this.bestStreak,
      tier: this.tier,
      stars: starsFor(cleared, accuracy, this.level.minAccuracy),
      words: [...this.words.values()],
    };
  }
}
