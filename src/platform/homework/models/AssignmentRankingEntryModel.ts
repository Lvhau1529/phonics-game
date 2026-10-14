import type { AssignmentRankingEntry, AvatarKey } from '@phonics/contracts';

/** Một dòng xếp hạng theo bài giao (best attempt đã chấm; RANK() 1, 1, 3) */
export class AssignmentRankingEntryModel {
  readonly rank: number;
  readonly studentId: string;
  readonly displayName: string;
  readonly avatarKey: AvatarKey;
  readonly submissionId: string;
  readonly totalScore: number;
  readonly maxScore: number;
  readonly percent: number;
  readonly durationMs: number | null;
  readonly submittedAt: string;
  readonly attemptNo: number;
  readonly isMe: boolean;

  constructor(data: AssignmentRankingEntry) {
    this.rank = data.rank;
    this.studentId = data.studentId;
    this.displayName = data.displayName;
    this.avatarKey = data.avatarKey;
    this.submissionId = data.submissionId;
    this.totalScore = data.totalScore;
    this.maxScore = data.maxScore;
    this.percent = data.percent;
    this.durationMs = data.durationMs;
    this.submittedAt = data.submittedAt;
    this.attemptNo = data.attemptNo;
    this.isMe = data.isMe;
  }

  get isChampion(): boolean {
    return this.rank === 1;
  }

  get isPodium(): boolean {
    return this.rank <= 3;
  }

  /** "8/10" */
  get scoreText(): string {
    return `${this.totalScore}/${this.maxScore}`;
  }
}
