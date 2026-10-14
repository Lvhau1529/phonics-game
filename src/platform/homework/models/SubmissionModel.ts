import type {
  MediaMap,
  QuestionAnswer,
  QuestionAnswerKey,
  QuestionType,
  StudentSnapshotItem,
  SubmissionAnswerView,
  SubmissionDetail,
  SubmissionStatus,
} from '@phonics/contracts';

/** Một câu trong bài nộp (`SubmissionAnswerView`) + getter */
export class SubmissionItemModel {
  readonly worksheetItemId: string;
  readonly questionType: QuestionType;
  readonly maxPoints: number;
  readonly answer: QuestionAnswer | null;
  readonly isCorrect: boolean | null;
  readonly autoScore: number | null;
  readonly manualScore: number | null;
  readonly score: number | null;
  readonly teacherNote: string | null;
  readonly gradedAt: string | null;
  /** Chỉ có khi GRADED và GV bật "cho xem đáp án" */
  readonly answerKey: QuestionAnswerKey | null;

  constructor(data: SubmissionAnswerView) {
    this.worksheetItemId = data.worksheetItemId;
    this.questionType = data.questionType;
    this.maxPoints = data.maxPoints;
    this.answer = data.answer;
    this.isCorrect = data.isCorrect;
    this.autoScore = data.autoScore;
    this.manualScore = data.manualScore;
    this.score = data.score;
    this.teacherNote = data.teacherNote;
    this.gradedAt = data.gradedAt;
    this.answerKey = data.answerKey;
  }

  get isManual(): boolean {
    return this.questionType === 'TRACE_AND_READ' || this.questionType === 'SPEAK';
  }

  /** Câu chấm tay chưa có điểm */
  get isPending(): boolean {
    return this.isManual && this.manualScore === null;
  }

  /** Kết quả cho bé: right / almost / wrong / checking (GV chưa chấm) */
  get outcome(): 'right' | 'almost' | 'wrong' | 'checking' {
    if (this.isPending) return 'checking';
    const score = this.manualScore ?? this.autoScore ?? 0;
    if (this.isCorrect || score >= this.maxPoints) return 'right';
    if (score > 0) return 'almost';
    return 'wrong';
  }
}

/** Bài nộp của học sinh (`SubmissionDetail`, phiếu không có đáp án) */
export class SubmissionModel {
  readonly id: string;
  readonly assignmentId: string;
  readonly attemptNo: number;
  readonly status: SubmissionStatus;
  readonly startedAt: string;
  readonly submittedAt: string | null;
  readonly gradedAt: string | null;
  readonly autoScore: number;
  readonly manualScore: number | null;
  readonly totalScore: number | null;
  readonly maxScore: number;
  readonly percent: number | null;
  readonly durationMs: number | null;
  readonly late: boolean;
  readonly updatedAt: string;
  readonly answers: SubmissionItemModel[];
  readonly items: StudentSnapshotItem[];
  readonly media: MediaMap;
  readonly pendingManual: number;

  constructor(data: SubmissionDetail) {
    this.id = data.id;
    this.assignmentId = data.assignmentId;
    this.attemptNo = data.attemptNo;
    this.status = data.status;
    this.startedAt = data.startedAt;
    this.submittedAt = data.submittedAt;
    this.gradedAt = data.gradedAt;
    this.autoScore = data.autoScore;
    this.manualScore = data.manualScore;
    this.totalScore = data.totalScore;
    this.maxScore = data.maxScore;
    this.percent = data.percent;
    this.durationMs = data.durationMs;
    this.late = data.late;
    this.updatedAt = data.updatedAt;
    this.answers = data.answers.map((a) => new SubmissionItemModel(a));
    // Học sinh nhận bản không có answerKey; GV nhận bản đầy đủ — cả hai cùng cấu trúc item
    this.items = data.worksheet.sections.flatMap((section) => section.items as StudentSnapshotItem[]);
    this.media = data.media;
    this.pendingManual = data.pendingManual;
  }

  get isInProgress(): boolean {
    return this.status === 'IN_PROGRESS';
  }

  get isGraded(): boolean {
    return this.status === 'GRADED';
  }

  /** Câu trả lời đã lưu theo worksheetItemId (để nạp lại khi tiếp tục làm) */
  get answerMap(): Record<string, QuestionAnswer> {
    const map: Record<string, QuestionAnswer> = {};
    for (const a of this.answers) if (a.answer) map[a.worksheetItemId] = a.answer;
    return map;
  }

  answerOf(worksheetItemId: string): SubmissionItemModel | undefined {
    return this.answers.find((a) => a.worksheetItemId === worksheetItemId);
  }

  /** Điểm hiện có "7/10" (đã chấm: tổng; chờ chấm: điểm tự chấm) */
  get scoreText(): string {
    return `${this.totalScore ?? this.autoScore}/${this.maxScore}`;
  }

  /** Số câu đúng hoàn toàn */
  get rightCount(): number {
    return this.answers.filter((a) => a.outcome === 'right').length;
  }

  /** 0..3 sao theo % (chỉ khi đã chấm) */
  get stars(): number {
    if (this.percent === null) return 0;
    if (this.percent >= 0.9) return 3;
    if (this.percent >= 0.7) return 2;
    if (this.percent >= 0.5) return 1;
    return 0;
  }
}
