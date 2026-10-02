import type { AvatarKey, RankingEntry } from '@phonics/contracts';

/**
 * Một dòng bảng xếp hạng lớp (từ `RankingEntry` của BE, GET /me/class/ranking).
 * Field giữ nguyên tên như contracts; getter là dữ liệu chỉ phía FE dùng.
 */
export class RankingEntryModel {
  /** RANK(): 1, 1, 3 — bằng điểm thì cùng hạng */
  readonly rank: number;
  readonly studentId: string;
  readonly displayName: string;
  readonly avatarKey: AvatarKey;
  readonly points: number;
  readonly isMe: boolean;

  constructor(data: RankingEntry) {
    this.rank = data.rank;
    this.studentId = data.studentId;
    this.displayName = data.displayName;
    this.avatarKey = data.avatarKey;
    this.points = data.points;
    this.isMe = data.isMe;
  }

  /** Hạng nhất (vương miện) */
  get isChampion(): boolean {
    return this.rank === 1;
  }

  /** Top 3 (huy chương / vương miện) */
  get isPodium(): boolean {
    return this.rank <= 3;
  }
}
