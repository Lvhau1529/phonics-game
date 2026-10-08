/**
 * Sinh đề từ một cấp (GAMEPLAY_PHONICS_V2.md §3, §5):
 *   - đúng 1 cá đúng mỗi đề; cá gây nhiễu không bao giờ khớp mục tiêu
 *   - cấp nghe từ: từ gây nhiễu ưu tiên cặp Magic-E (kit / kite) rồi từ chỉ khác 1 âm (tub / cub / rub)
 *   - cấp vần: giữ cùng một vần RHYME_CHAIN đề liền nhau (Rhyme Chain)
 *   - mục tiêu / từ bốc không hoàn lại (hết thì xáo lại), không lặp ngay phần tử vừa ra
 *   - máy không đọc được (không có Web Speech / tắt VOICE): hiện từ trên HUD thay cho giọng đọc
 */
import type { LevelDef, QuestionMode, TargetDef } from '@/games/phonics-ocean/content/schema';
import type { Question } from '@/games/phonics-ocean/session/types';
import { shuffle } from '@/shared/random';

/** Số đề liền nhau cùng một vần (cấp Rhyme Current) */
export const RHYME_CHAIN = 3;

/** Bốc không hoàn lại; hết thì xáo lại (không bốc trùng phần tử vừa bốc) */
export class Bag<T> {
  private queue: T[] = [];
  private last: T | null = null;

  constructor(private readonly items: readonly T[]) {
    if (items.length === 0) throw new Error('Bag: empty list');
  }

  draw(): T {
    if (this.queue.length === 0) {
      this.queue = shuffle(this.items);
      if (this.queue.length > 1 && this.queue[0] === this.last) this.queue.push(this.queue.shift()!);
    }
    this.last = this.queue.shift()!;
    return this.last;
  }
}

/** Từ có khớp mục tiêu không (theo kiểu câu hỏi của cấp) */
export function matchesTarget(mode: QuestionMode, target: string, word: string): boolean {
  switch (mode) {
    case 'initial':
      return word.startsWith(target);
    case 'rime':
      return word.endsWith(target.replace(/^-/, ''));
    case 'contains':
      return word.includes(target);
    default:
      return word === target;
  }
}

/** Hai từ cùng độ dài, chỉ khác đúng 1 chữ (cặp tối thiểu: tub / cub) */
export function oneLetterApart(a: string, b: string): boolean {
  if (a.length !== b.length || a === b) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) diff += 1;
  return diff === 1;
}

/** Cặp Magic-E: cap / cape */
export function magicEPair(a: string, b: string): boolean {
  return a === `${b}e` || b === `${a}e`;
}

/** Từ gây nhiễu cho đề nghe từ: gần âm nhất trước, xáo trong từng nhóm */
function rankedDistractors(answer: string, pool: readonly string[]): string[] {
  const rank = (word: string) => {
    if (magicEPair(word, answer)) return 0;
    if (oneLetterApart(word, answer)) return 1;
    if (word.length === answer.length) return 2;
    return 3;
  };
  const groups: string[][] = [[], [], [], []];
  new Set(pool).forEach((word) => {
    if (word !== answer) groups[rank(word)].push(word);
  });
  return groups.flatMap((group) => shuffle(group));
}

const article = (word: string) => (/^[aeiou]/.test(word) ? 'an' : 'a');

interface DeckOptions {
  /** Máy đọc được (có Web Speech và bật VOICE) */
  canSpeak: boolean;
}

export class QuestionDeck {
  private readonly targets: Bag<TargetDef> | null;
  private readonly targetWords = new Map<string, Bag<string>>();
  private readonly words: Bag<string>;
  private chainTarget: TargetDef | null = null;
  private chainLeft = 0;
  private counter = 0;

  constructor(
    private readonly level: LevelDef,
    private readonly options: DeckOptions,
  ) {
    const usable = level.targets.filter((target) => this.distractorPool(target).length > 0);
    this.targets = usable.length > 0 ? new Bag(usable) : null;
    this.words = new Bag(level.words);
  }

  /** Đề tiếp theo với `choiceCount` cá (ít hơn nếu cấp không đủ từ gây nhiễu) */
  next(choiceCount: number): Question {
    this.counter += 1;
    const { mode } = this.level;
    if ((mode === 'initial' || mode === 'rime' || mode === 'contains') && this.targets) {
      return this.targetQuestion(this.drawTarget(), choiceCount);
    }
    return this.wordQuestion(this.words.draw(), choiceCount);
  }

  private drawTarget(): TargetDef {
    if (this.level.mode === 'rime' && this.chainTarget && this.chainLeft > 0) {
      this.chainLeft -= 1;
      return this.chainTarget;
    }
    const target = this.targets!.draw();
    this.chainTarget = target;
    this.chainLeft = RHYME_CHAIN - 1;
    return target;
  }

  private distractorPool(target: TargetDef): string[] {
    const { mode, words, extraDistractors } = this.level;
    return [...new Set([...words, ...extraDistractors])].filter(
      (word) => !matchesTarget(mode, target.id, word),
    );
  }

  private targetQuestion(target: TargetDef, choiceCount: number): Question {
    let bag = this.targetWords.get(target.id);
    if (!bag) {
      bag = new Bag(target.words);
      this.targetWords.set(target.id, bag);
    }
    const answer = bag.draw();
    const distractors = shuffle(this.distractorPool(target)).slice(0, Math.max(1, choiceCount - 1));
    const { mode } = this.level;
    return {
      id: `q${this.counter}`,
      mode,
      targetId: target.id,
      display: target.label,
      hidden: false,
      promptSpeech: mode === 'initial' ? target.speech : ['Find', ...target.speech],
      answer,
      choices: shuffle([answer, ...distractors]),
      feedbackSpeech: mode === 'initial' ? [...target.speech, answer] : [answer],
    };
  }

  private wordQuestion(answer: string, choiceCount: number): Question {
    const { mode, words, extraDistractors } = this.level;
    const distractors = rankedDistractors(answer, [...words, ...extraDistractors]).slice(
      0,
      Math.max(1, choiceCount - 1),
    );
    const sentence = mode === 'sentence' ? `I can see ${article(answer)} ___.` : undefined;
    return {
      id: `q${this.counter}`,
      mode,
      targetId: answer,
      display: answer,
      hidden: this.options.canSpeak,
      sentence,
      promptSpeech: sentence ? [`I can see ${article(answer)}`, answer] : [answer],
      answer,
      choices: shuffle([answer, ...distractors]),
      feedbackSpeech: sentence ? [`I can see ${article(answer)} ${answer}`] : [answer],
    };
  }
}
