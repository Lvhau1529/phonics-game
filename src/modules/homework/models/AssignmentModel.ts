import type {
  AssignmentStatus,
  MediaMap,
  MyAssignmentBest,
  MyAssignmentDetail,
  MyAssignmentSummary,
  StudentSnapshotItem,
  StudentWorksheetView,
  Subject,
  SubmissionSummary,
  WorksheetKind,
} from '@phonics/contracts';

/**
 * Bài giao nhìn từ học sinh (`MyAssignmentSummary`). Field giữ nguyên tên như contracts; getter là dữ liệu chỉ
 * FE dùng (nhãn tiếng Anh ngắn, sao, cờ hiển thị).
 */
export class AssignmentModel {
  readonly id: string;
  readonly worksheetTitle: string;
  readonly subject: Subject;
  readonly topic: string | null;
  readonly kind: WorksheetKind;
  readonly scheduledFor: string;
  readonly availableFrom: string;
  readonly dueAt: string | null;
  readonly allowLate: boolean;
  readonly maxAttempts: number;
  readonly showAnswersAfterSubmit: boolean;
  readonly status: AssignmentStatus;
  readonly isOpen: boolean;
  readonly maxScore: number;
  readonly itemCount: number;
  readonly hasManualItems: boolean;
  readonly attemptsUsed: number;
  readonly canStart: boolean;
  readonly inProgressSubmissionId: string | null;
  readonly best: MyAssignmentBest | null;
  readonly unreadComments: number;

  constructor(data: MyAssignmentSummary) {
    this.id = data.id;
    this.worksheetTitle = data.worksheetTitle;
    this.subject = data.subject;
    this.topic = data.topic;
    this.kind = data.kind;
    this.scheduledFor = data.scheduledFor;
    this.availableFrom = data.availableFrom;
    this.dueAt = data.dueAt;
    this.allowLate = data.allowLate;
    this.maxAttempts = data.maxAttempts;
    this.showAnswersAfterSubmit = data.showAnswersAfterSubmit;
    this.status = data.status;
    this.isOpen = data.isOpen;
    this.maxScore = data.maxScore;
    this.itemCount = data.itemCount;
    this.hasManualItems = data.hasManualItems;
    this.attemptsUsed = data.attemptsUsed;
    this.canStart = data.canStart;
    this.inProgressSubmissionId = data.inProgressSubmissionId;
    this.best = data.best;
    this.unreadComments = data.unreadComments;
  }

  /** Đã có bài nộp (chờ chấm hoặc đã chấm) */
  get isDone(): boolean {
    return this.best !== null;
  }

  /** Bé đang làm dở */
  get isInProgress(): boolean {
    return this.inProgressSubmissionId !== null;
  }

  /** Đã có điểm cuối (GV chốt / tự chấm xong) */
  get isGraded(): boolean {
    return this.best?.status === 'GRADED';
  }

  /** Còn việc để làm: chưa nộp (hoặc còn lượt) và bài đang mở */
  get isTodo(): boolean {
    return this.canStart && !this.isDone;
  }

  /** Sắp mở (chưa tới giờ) */
  get isUpcoming(): boolean {
    return this.status === 'SCHEDULED';
  }

  /** Điểm cuối "8/10"; chưa có → null */
  get scoreText(): string | null {
    if (!this.best || this.best.totalScore === null) return null;
    return `${this.best.totalScore}/${this.maxScore}`;
  }

  /** 0..3 sao theo % điểm cuối (≥ 90 → 3, ≥ 70 → 2, ≥ 50 → 1) */
  get stars(): number {
    const percent = this.best?.percent ?? null;
    if (percent === null) return 0;
    if (percent >= 0.9) return 3;
    if (percent >= 0.7) return 2;
    if (percent >= 0.5) return 1;
    return 0;
  }

  /** Nhãn trạng thái ngắn cho bé */
  get statusLabel(): string {
    if (this.isGraded) return 'DONE';
    if (this.best) return 'TEACHER IS CHECKING';
    if (this.isInProgress) return 'CONTINUE';
    if (this.isUpcoming) return 'SOON';
    if (!this.isOpen) return 'CLOSED';
    return 'NEW';
  }

  /** Nhãn nút chính */
  get actionLabel(): string {
    if (this.isDone && !this.canStart) return 'SEE RESULT';
    if (this.isDone) return 'TRY AGAIN';
    if (this.isInProgress) return 'CONTINUE';
    return 'START';
  }

  /** Dòng phụ: chủ đề / loại phiếu */
  get subtitle(): string {
    return [this.topic, this.subject].filter(Boolean).join(' · ');
  }
}

/** Bài giao đầy đủ: phiếu (không đáp án) + media + các lần làm */
export class AssignmentDetailModel extends AssignmentModel {
  readonly worksheet: StudentWorksheetView;
  readonly media: MediaMap;
  readonly submissions: SubmissionSummary[];

  constructor(data: MyAssignmentDetail) {
    super(data);
    this.worksheet = data.worksheet;
    this.media = data.media;
    this.submissions = data.submissions;
  }

  /** Câu theo thứ tự Part → câu (đánh số từ 1) */
  get items(): StudentSnapshotItem[] {
    return this.worksheet.sections.flatMap((section) => section.items);
  }

  /** Bài nộp mới nhất (attempt lớn nhất) */
  get latestSubmission(): SubmissionSummary | null {
    return this.submissions.reduce<SubmissionSummary | null>(
      (latest, s) => (!latest || s.attemptNo > latest.attemptNo ? s : latest),
      null,
    );
  }
}
