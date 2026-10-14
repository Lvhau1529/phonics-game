/**
 * Câu trả lời của từng dạng câu hỏi (payload `QuestionAnswer` của contracts, luôn có `type`):
 * đã trả lời chưa (để đếm tiến độ, bật nút SEND), và bản rỗng để renderer bắt đầu.
 */
import type { QuestionAnswer, QuestionConfig } from '@phonics/contracts';

/** Bé đã làm câu này (ít nhất một phần) */
export function isAnswered(answer: QuestionAnswer | null | undefined): boolean {
  if (!answer) return false;
  switch (answer.type) {
    case 'MISSING_SOUND':
      return answer.letters.some((l) => l !== '') || answer.word !== '';
    case 'CROSSWORD':
      return answer.cells.length > 0;
    case 'UNSCRAMBLE_WORD':
      return answer.word !== '';
    case 'PICK_LETTERS':
      return answer.letterIds.length > 0 || answer.word !== '';
    case 'WORD_SEARCH':
      return answer.found.length > 0;
    case 'ODD_ONE_OUT':
    case 'MULTIPLE_CHOICE':
    case 'PATTERN_NEXT':
      return answer.optionId !== null && answer.optionId !== '';
    case 'NUMBER_PICTURES':
      return answer.numbers.some((n) => n.number !== null);
    case 'FILL_BLANK_WORD_BANK':
      return answer.blanks.length > 0;
    case 'WORD_ORDER':
      return answer.order.length > 0;
    case 'INLINE_CHOICE':
      return answer.picks.length > 0;
    case 'TRACE_AND_READ':
      return !!answer.traceMediaId || !!answer.recordingMediaId;
    case 'SPEAK':
      return !!answer.recordingMediaId;
  }
}

/** Câu chấm tay đã đủ phần bắt buộc (tô / ghi âm) */
export function isComplete(config: QuestionConfig, answer: QuestionAnswer | null | undefined): boolean {
  if (!answer) return false;
  if (config.type === 'TRACE_AND_READ' && answer.type === 'TRACE_AND_READ') {
    return (
      (!config.requireTrace || !!answer.traceMediaId) &&
      (!config.requireRecording || !!answer.recordingMediaId)
    );
  }
  return isAnswered(answer);
}
