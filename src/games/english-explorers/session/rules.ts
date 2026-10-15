/**
 * Luật Little English Explorers (thuần TS): chọn câu cho ván, điểm, sao, điểm nói.
 */
import { ALL_WORLDS, ALL_WORLDS_COUNT, WORLDS, getWorld } from '@/games/english-explorers/content/worlds';
import type { RoundQuestion } from '@/games/english-explorers/session/types';
import { shuffle } from '@/core/utils/random';
import { matchWords } from '@/core/utils/speechRecognition';

export const SCORING = {
  /** Điểm chọn đúng theo số lần sai trước đó: đúng ngay 10, sai 1 lần 5, sai 2 lần 2 */
  byMisses: [10, 5, 2] as readonly number[],
  /** Nói đủ câu mẫu */
  spoke: 5,
} as const;

/** Micro nghe được ít nhất ngần này phần từ của câu mẫu thì tính là nói đúng câu */
export const SPEAK_MATCH = 0.6;

export function pointsFor(misses: number): number {
  return SCORING.byMisses[Math.min(misses, SCORING.byMisses.length - 1)];
}

/** Câu của ván: một thế giới = cả 10 câu (xáo thứ tự); ALL WORLDS = 10 câu rải đều 3 thế giới */
export function pickQuestions(
  worldId: string,
  random: <T>(items: readonly T[]) => T[] = shuffle,
): RoundQuestion[] {
  const questions =
    worldId === ALL_WORLDS
      ? interleave(WORLDS.map((world) => random(world.questions))).slice(0, ALL_WORLDS_COUNT)
      : random(getWorld(worldId)?.questions ?? WORLDS[0].questions);
  return questions.map((question) => {
    const options = random(question.options);
    return { question, options, answer: options.indexOf(question.options[question.answer]) };
  });
}

/** [[a1,a2],[b1,b2]] -> [a1,b1,a2,b2] */
function interleave<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const longest = Math.max(...lists.map((list) => list.length));
  for (let i = 0; i < longest; i += 1) for (const list of lists) if (i < list.length) out.push(list[i]);
  return out;
}

/** Điểm nói: micro nghe gần đủ câu mẫu; micro không dùng được -> tin bé (giáo viên nghe) */
export function earnsSpeakingPoints(heard: string, sentence: string, micAvailable: boolean): boolean {
  return micAvailable ? matchWords(heard, sentence) >= SPEAK_MATCH : true;
}

/** Sao theo số câu đúng ngay lần đầu: ≥ 90% 3 sao, ≥ 60% 2 sao, còn lại 1 sao */
export function starsFor(firstTry: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = firstTry / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

/** Câu hỏi để máy đọc: chỗ trống đọc thành "...", kèm 3 đáp án ("big, small, or thin?") */
export function spokenPrompt(prompt: string, labels: readonly string[]): string {
  const choices = `${labels.slice(0, -1).join(', ')}, or ${labels[labels.length - 1]}?`;
  return prompt.includes('___') ? `${prompt.replace('___', '...')} ${choices}` : `${prompt} ${choices}`;
}
