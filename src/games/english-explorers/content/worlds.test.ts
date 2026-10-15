import { describe, expect, it } from 'vitest';
import { WORLDS, worldOf } from '@/games/english-explorers/content/worlds';
import { toWords } from '@/core/utils/speechRecognition';

const allQuestions = WORLDS.flatMap((world) => world.questions);

describe('nội dung Little English Explorers', () => {
  it('3 thế giới × 10 câu, id không trùng, id câu theo thế giới', () => {
    expect(WORLDS.map((world) => world.id)).toEqual(['habitats', 'describe', 'body']);
    for (const world of WORLDS) {
      expect(world.questions, world.id).toHaveLength(10);
      for (const question of world.questions) expect(worldOf(question.id)).toBe(world);
    }
    expect(new Set(allQuestions.map((question) => question.id)).size).toBe(allQuestions.length);
  });

  it('3 đáp án khác nhau, câu mẫu chứa đáp án đúng', () => {
    for (const question of allQuestions) {
      expect(new Set(question.options.map((option) => option.label)).size, question.id).toBe(3);
      const answer = toWords(question.options[question.answer].label);
      const sentence = toWords(question.sentence);
      for (const word of answer.filter((w) => !['a', 'the'].includes(w))) {
        expect(sentence, `${question.id}: ${word}`).toContain(word);
      }
    }
  });

  it('câu có chỗ trống: điền đáp án đúng ra đúng câu mẫu', () => {
    for (const question of allQuestions.filter((q) => q.prompt.includes('___'))) {
      const filled = question.prompt.replace('___', question.options[question.answer].label);
      expect(filled, question.id).toBe(question.sentence);
    }
  });
});
