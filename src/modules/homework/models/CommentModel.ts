import type { AvatarKey, CommentReply, CommentView, Role } from '@phonics/contracts';

/** Nhận xét của GV / trả lời của bé trên một bài nộp (gốc có `replies`) */
export class CommentModel {
  readonly id: string;
  readonly submissionId: string;
  readonly worksheetItemId: string | null;
  readonly authorId: string;
  readonly authorName: string;
  readonly authorRole: Role;
  readonly authorAvatarKey: AvatarKey;
  readonly parentId: string | null;
  readonly body: string;
  readonly deleted: boolean;
  readonly createdAt: string;
  readonly replies: CommentModel[];

  constructor(data: CommentView | CommentReply) {
    this.id = data.id;
    this.submissionId = data.submissionId;
    this.worksheetItemId = data.worksheetItemId;
    this.authorId = data.authorId;
    this.authorName = data.authorName;
    this.authorRole = data.authorRole;
    this.authorAvatarKey = data.authorAvatarKey;
    this.parentId = data.parentId;
    this.body = data.body;
    this.deleted = data.deleted;
    this.createdAt = data.createdAt;
    this.replies = 'replies' in data ? data.replies.map((r) => new CommentModel(r)) : [];
  }

  /** Do bé viết (trả lời) */
  get isStudent(): boolean {
    return this.authorRole === 'STUDENT';
  }

  /** Nhận xét chung cả bài (không gắn câu nào) */
  get isGeneral(): boolean {
    return this.worksheetItemId === null;
  }
}
