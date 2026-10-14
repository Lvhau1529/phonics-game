/**
 * Props chung của renderer từng dạng câu hỏi (màn làm bài `do` và màn xem lại `review`).
 * Mọi payload trả lời có `type` literal như contracts `QuestionAnswer`.
 */
import type {
  AnswerKeyOf,
  AnswerOf,
  ConfigOf,
  MediaRef,
  QuestionType,
} from '@/modules/homework/models/question';

export type RendererMode = 'do' | 'review';

export interface RendererProps<T extends QuestionType> {
  config: ConfigOf<T>;
  answer: AnswerOf<T> | null;
  /** Chỉ có ở màn xem lại khi GV cho xem đáp án */
  answerKey?: AnswerKeyOf<T> | null;
  mode: RendererMode;
  onChange: (answer: AnswerOf<T>) => void;
  /** File bé vừa tải lên (ghi âm / ảnh tô) để thêm vào map media */
  onMedia?: (ref: MediaRef) => void;
}

/** Chuẩn hoá để so khớp (xem lại): chữ thường, bỏ khoảng trắng thừa */
export const norm = (s: string | null | undefined): string => (s ?? '').trim().toLowerCase();
