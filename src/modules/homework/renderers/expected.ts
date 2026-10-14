/**
 * Đáp án đúng dạng chữ ngắn cho màn xem lại ("ANSWER: map") — chỉ khi GV cho xem đáp án.
 */
import type { QuestionAnswerKey, QuestionConfig } from '@/modules/homework/models/question';

export function expectedText(
  config: QuestionConfig,
  key: QuestionAnswerKey | null | undefined,
): string | null {
  if (!key || key.type !== config.type) return null;
  switch (key.type) {
    case 'MISSING_SOUND':
      return `${key.letters.join(' ')} → ${key.word}`;
    case 'CROSSWORD':
      return key.words.map((w) => `${w.number}. ${w.answer}`).join(' · ');
    case 'UNSCRAMBLE_WORD':
      return key.word;
    case 'PICK_LETTERS':
      return key.word;
    case 'WORD_SEARCH':
      return key.placements.map((p) => p.word).join(' · ');
    case 'ODD_ONE_OUT': {
      if (config.type !== 'ODD_ONE_OUT') return null;
      const index = config.options.findIndex((o) => o.id === key.optionId);
      const option = config.options[index];
      return option?.label ?? `picture ${index + 1}`;
    }
    case 'PATTERN_NEXT': {
      if (config.type !== 'PATTERN_NEXT') return null;
      const index = config.options.findIndex((o) => o.id === key.optionId);
      const option = config.options[index];
      return [option?.word ?? `picture ${index + 1}`, key.word].filter(Boolean).join(' · ');
    }
    case 'NUMBER_PICTURES': {
      if (config.type !== 'NUMBER_PICTURES') return null;
      return key.numbers
        .map((n) => {
          const index = config.images.findIndex((img) => img.id === n.imageId);
          const word = config.words.find((w) => w.number === n.number)?.word;
          return `picture ${index + 1} = ${n.number}${word ? ` ${word}` : ''}`;
        })
        .join(' · ');
    }
    case 'MULTIPLE_CHOICE':
      return config.type === 'MULTIPLE_CHOICE'
        ? (config.options.find((o) => o.id === key.optionId)?.text ?? null)
        : null;
    case 'FILL_BLANK_WORD_BANK':
      return key.blanks.map((b) => b.word).join(' · ');
    case 'WORD_ORDER': {
      if (config.type !== 'WORD_ORDER') return null;
      const first = key.accepted[0] ?? [];
      return `${first.map((i) => config.words[i] ?? '').join(' ')}${config.endPunctuation ?? ''}`;
    }
    case 'INLINE_CHOICE':
      return key.picks.map((p) => p.option).join(' · ');
    case 'TRACE_AND_READ':
    case 'SPEAK':
      return null;
  }
}
