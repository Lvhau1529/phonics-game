/**
 * Kiểu dữ liệu câu hỏi / câu trả lời / media mà renderer và component bài tập dùng.
 * Dữ liệu tới UI qua `AssignmentDetailModel` / `SubmissionModel` (đã parse zod ở repository); shape giữ đúng
 * contracts nên chỉ khai báo lại kiểu ở đây — UI import từ file này, không import `@phonics/contracts`.
 */
export type {
  AnswerKeyOf,
  AnswerOf,
  Cell,
  ConfigOf,
  Direction,
  MediaMap,
  MediaRef,
  QuestionAnswer,
  QuestionAnswerKey,
  QuestionConfig,
  QuestionExample,
  QuestionType,
} from '@phonics/contracts';
/** Số ô trống `_` trong mẫu chữ (dùng chung với validate của contracts) */
export { blankCount } from '@phonics/contracts';
