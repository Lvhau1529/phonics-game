/**
 * Sinh câu hỏi từ gói nội dung theo luật plan §8:
 *   - không trùng lựa chọn; chữ / từ gây nhiễu hợp lý (lấy từ `confusables` của gói)
 *   - mẫu giáo mặc định 3 lựa chọn, tối đa 4
 *   - mục tiêu trả lời chưa tốt được hỏi lại sau vài câu (trong cùng lượt)
 *   - đáp án không nằm cùng một vị trí quá 2 lần liên tiếp
 *   - thứ tự vị trí xáo độc lập với thứ tự mục tiêu
 */
import { playableModes, type LevelDef, type QuestionMode } from '@/games/food-stream/content/levels';
import {
  hasPicture,
  PICTURED_WORDS,
  type ContentPack,
  type SoundDef,
  type WordTarget,
} from '@/games/food-stream/content/packs';
import type { Choice, Question, Slot } from '@/games/food-stream/session/types';
import { pickRandom, shuffle } from '@/core/utils/random';

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
/** Số ô chữ tối đa trong khay khi ghép từ (vừa màn hình điện thoại) */
const MAX_TILES = 6;
/** Mục tiêu trả lời chưa tốt quay lại sau ngần này câu */
const RETRY_AFTER = 2;
/** Đáp án không được nằm cùng vị trí quá ngần này lần liên tiếp */
const MAX_SAME_POSITION = 2;

type Target = { kind: 'sound'; sound: SoundDef } | { kind: 'word'; word: WordTarget };

interface DeckOptions {
  /** Máy đọc được (có Web Speech và bật VOICE) — không thì hiện chữ / tranh thay cho âm thanh */
  canSpeak: boolean;
}

const targetId = (target: Target) =>
  target.kind === 'sound' ? `sound:${target.sound.grapheme}` : `word:${target.word.id}`;

/** Bốc không hoàn lại; hết thì xáo lại (không bốc trùng phần tử vừa bốc) */
class Bag<T> {
  private queue: T[] = [];
  private last: T | null = null;

  constructor(private readonly items: readonly T[]) {}

  draw(): T {
    if (this.queue.length === 0) {
      this.queue = shuffle(this.items);
      if (this.queue.length > 1 && this.queue[0] === this.last) this.queue.push(this.queue.shift()!);
    }
    this.last = this.queue.shift()!;
    return this.last;
  }
}

/** `count` phần tử khác nhau từ `pool`, bỏ qua `exclude` */
function pickDistinct(pool: readonly string[], count: number, exclude: readonly string[]): string[] {
  return shuffle([...new Set(pool)].filter((item) => !exclude.includes(item))).slice(0, count);
}

export class QuestionDeck {
  private readonly modes: QuestionMode[];
  private readonly bags = new Map<QuestionMode, Bag<Target>>();
  private readonly retries: { mode: QuestionMode; target: Target; dueIn: number }[] = [];
  private readonly correctPositions: number[] = [];
  private modeBag: Bag<QuestionMode>;
  private counter = 0;

  constructor(
    private readonly pack: ContentPack,
    private readonly level: LevelDef,
    private readonly options: DeckOptions,
  ) {
    this.modes = playableModes(pack, level);
    if (this.modes.length === 0) throw new Error(`Pack ${pack.id} cannot play level ${level.id}`);
    this.modeBag = new Bag(this.modes);
  }

  next(): Question {
    this.retries.forEach((retry) => (retry.dueIn -= 1));
    const dueIndex = this.retries.findIndex((retry) => retry.dueIn <= 0);
    if (dueIndex >= 0) {
      const [retry] = this.retries.splice(dueIndex, 1);
      return this.build(retry.mode, retry.target);
    }
    const mode = this.modeBag.draw();
    return this.build(mode, this.bagOf(mode).draw());
  }

  /** Câu trả lời chưa đúng ngay lần đầu -> hỏi lại mục tiêu đó sau vài câu */
  requeue(question: Question): void {
    const target: Target | null = question.sound
      ? { kind: 'sound', sound: question.sound }
      : question.word
        ? { kind: 'word', word: question.word }
        : null;
    if (!target || this.retries.some((retry) => targetId(retry.target) === question.targetId)) return;
    this.retries.push({ mode: question.mode, target, dueIn: RETRY_AFTER + 1 });
  }

  // -------------------------------------------------------------------------
  // Mục tiêu theo kiểu câu hỏi
  // -------------------------------------------------------------------------
  private bagOf(mode: QuestionMode): Bag<Target> {
    let bag = this.bags.get(mode);
    if (!bag) {
      bag = new Bag(this.targetsFor(mode));
      this.bags.set(mode, bag);
    }
    return bag;
  }

  private targetsFor(mode: QuestionMode): Target[] {
    const { sounds, words, spellingWords } = this.pack;
    const asWords = (list: WordTarget[]): Target[] => list.map((word) => ({ kind: 'word', word }));
    switch (mode) {
      case 'hear-and-tap':
        return sounds.map((sound) => ({ kind: 'sound', sound }));
      case 'find-the-word':
        return sounds
          .filter((sound) => this.picturedWordsStartingWith(sound).length > 0)
          .map((sound) => ({ kind: 'sound', sound }));
      case 'picture-to-sound':
        return asWords(words.filter(hasPicture));
      case 'build-word':
      case 'listen-and-build':
        return asWords(spellingWords);
      case 'missing-letter':
        return asWords(spellingWords.filter((word) => word.word.length === 3));
    }
  }

  private picturedWordsStartingWith(sound: SoundDef): WordTarget[] {
    return this.pack.words.filter((word) => hasPicture(word) && word.initialSound === sound.grapheme);
  }

  // -------------------------------------------------------------------------
  // Dựng câu hỏi
  // -------------------------------------------------------------------------
  private build(mode: QuestionMode, target: Target): Question {
    this.counter += 1;
    const base = {
      id: `q${this.counter}`,
      mode,
      targetId: targetId(target),
      difficulty: this.level.difficulty,
    };
    if (target.kind === 'sound') {
      return mode === 'find-the-word'
        ? { ...base, ...this.findTheWord(target.sound) }
        : { ...base, ...this.hearAndTap(target.sound) };
    }
    switch (mode) {
      case 'picture-to-sound':
        return { ...base, ...this.pictureToSound(target.word) };
      case 'missing-letter':
        return { ...base, ...this.missingLetter(target.word) };
      default:
        return { ...base, ...this.buildWord(target.word, mode === 'listen-and-build') };
    }
  }

  private hearAndTap(sound: SoundDef) {
    const { choices, correctChoiceIds } = this.singleChoice(
      sound.grapheme,
      this.letterDistractors(sound.grapheme, this.level.choices - 1),
    );
    return {
      sound,
      promptSpeech: [sound.speech, sound.speech],
      // Không đọc được thì hiện ký hiệu âm để vẫn chơi được
      promptText: this.options.canSpeak ? undefined : sound.phoneme,
      choices,
      correctChoiceIds,
      feedbackSpeech: [sound.speech],
    };
  }

  private pictureToSound(word: WordTarget) {
    const { choices, correctChoiceIds } = this.singleChoice(
      word.initialSound,
      this.letterDistractors(word.initialSound, this.level.choices - 1),
    );
    const sound = this.pack.sounds.find((item) => item.grapheme === word.initialSound);
    return {
      word,
      promptSpeech: [word.word],
      promptImage: word.imageAsset,
      choices,
      correctChoiceIds,
      feedbackSpeech: sound ? [sound.speech, word.word] : [word.word],
    };
  }

  private findTheWord(sound: SoundDef) {
    const answer = pickRandom(this.picturedWordsStartingWith(sound));
    const others = shuffle(PICTURED_WORDS.filter((word) => word.initialSound !== sound.grapheme)).slice(
      0,
      this.level.choices - 1,
    );
    const toChoice = (word: WordTarget): Choice => ({
      id: `word:${word.id}`,
      label: word.word,
      picture: word.imageAsset,
    });
    const choices = this.placeAnswer(toChoice(answer), others.map(toChoice));
    return {
      sound,
      word: answer,
      promptSpeech: [sound.speech, sound.speech],
      promptText: sound.phoneme,
      choices,
      correctChoiceIds: [toChoice(answer).id],
      feedbackSpeech: [sound.speech, answer.word],
    };
  }

  private buildWord(word: WordTarget, listenOnly: boolean) {
    const letters = [...word.word];
    const extra = Math.max(0, Math.min(this.level.extraTiles, MAX_TILES - letters.length));
    const tiles = shuffle([...letters, ...this.letterDistractors(letters, extra)]).map((label, index) => ({
      id: `tile:${index}`,
      label,
    }));
    // Mỗi vị trí trong từ lấy một ô chữ đúng chưa dùng (từ có chữ lặp: "mom", "dad")
    const used = new Set<string>();
    const correctChoiceIds = letters.map((letter) => {
      const tile = tiles.find((item) => item.label === letter && !used.has(item.id))!;
      used.add(tile.id);
      return tile.id;
    });
    const showPicture = hasPicture(word) && (!listenOnly || !this.options.canSpeak);
    return {
      word,
      promptSpeech: [word.word],
      promptImage: showPicture ? word.imageAsset : undefined,
      // Không tranh + không đọc được: hiện chữ để trẻ vẫn ghép theo
      promptText: !showPicture && !this.options.canSpeak ? word.word : undefined,
      choices: tiles,
      correctChoiceIds,
      slots: letters.map((letter): Slot => ({ letter, given: false })),
      feedbackSpeech: [word.word],
    };
  }

  private missingLetter(word: WordTarget) {
    const letters = [...word.word];
    const missing = letters[1];
    const pool = VOWELS.includes(missing) ? VOWELS : this.pack.confusables;
    const { choices, correctChoiceIds } = this.singleChoice(
      missing,
      pickDistinct(pool, this.level.choices - 1, letters),
    );
    return {
      word,
      promptSpeech: [word.word],
      promptImage: hasPicture(word) ? word.imageAsset : undefined,
      choices,
      correctChoiceIds,
      slots: letters.map((letter, index): Slot => ({ letter, given: index !== 1 })),
      feedbackSpeech: [word.word],
    };
  }

  // -------------------------------------------------------------------------
  // Tiện ích
  // -------------------------------------------------------------------------
  /** Chữ gây nhiễu: chữ dễ nhầm của gói + âm khác của gói, không trùng chữ cần chọn */
  private letterDistractors(exclude: string | readonly string[], count: number): string[] {
    const excluded = typeof exclude === 'string' ? [exclude] : exclude;
    const pool = [...this.pack.confusables, ...this.pack.sounds.map((sound) => sound.grapheme)];
    const picked = pickDistinct(pool, count, excluded);
    // Gói ít chữ nhiễu: bù bằng nguyên âm
    return picked.length >= count
      ? picked
      : [...picked, ...pickDistinct(VOWELS, count - picked.length, [...excluded, ...picked])];
  }

  private singleChoice(answer: string, distractors: string[]) {
    const toChoice = (letter: string): Choice => ({ id: `letter:${letter}`, label: letter });
    const choices = this.placeAnswer(toChoice(answer), distractors.map(toChoice));
    return { choices, correctChoiceIds: [toChoice(answer).id] };
  }

  /** Xáo lựa chọn; tránh đáp án đứng cùng một chỗ quá MAX_SAME_POSITION lần liên tiếp */
  private placeAnswer(answer: Choice, others: Choice[]): Choice[] {
    const count = others.length + 1;
    const recent = this.correctPositions.slice(-MAX_SAME_POSITION);
    const blocked =
      recent.length === MAX_SAME_POSITION && recent.every((pos) => pos === recent[0]) ? recent[0] : -1;
    const positions = [...Array(count).keys()].filter((pos) => pos !== blocked);
    const position = pickRandom(positions);
    this.correctPositions.push(position);
    const choices = shuffle(others);
    choices.splice(position, 0, answer);
    return choices;
  }
}
