import type { AvatarKey, FamilyProfile, StudentClassRef, UserStatus } from '@phonics/contracts';

/**
 * Một hồ sơ bé trong màn chọn bé của phụ huynh (`GET /auth/profiles`). Chỉ hồ sơ đã duyệt (ACTIVE) mới vào chơi
 * được; PENDING = chờ trung tâm duyệt; REJECTED kèm lý do.
 */
export class FamilyProfileModel {
  readonly id: string;
  readonly displayName: string;
  readonly vietnameseName: string;
  readonly englishName: string | null;
  readonly avatarKey: AvatarKey;
  readonly status: UserStatus;
  readonly class: StudentClassRef | null;
  readonly rejectReason: string | null;

  constructor(data: FamilyProfile) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.vietnameseName = data.vietnameseName;
    this.englishName = data.englishName;
    this.avatarKey = data.avatarKey;
    this.status = data.status;
    this.class = data.class;
    this.rejectReason = data.rejectReason;
  }

  /** Vào chơi được */
  get canPlay(): boolean {
    return this.status === 'ACTIVE';
  }

  /** Tên gọi ngắn trên thẻ (từ đầu tiên của tên hiển thị) */
  get firstName(): string {
    return this.displayName.trim().split(/\s+/)[0] ?? '';
  }

  /** Dòng trạng thái dưới tên (tiếng Anh ngắn, cho phụ huynh) */
  get statusText(): string {
    switch (this.status) {
      case 'ACTIVE':
        return this.class?.name ?? 'READY TO PLAY';
      case 'PENDING':
        return 'WAITING FOR APPROVAL';
      case 'REJECTED':
        return 'NOT APPROVED';
      default:
        return 'ACCOUNT OFF';
    }
  }
}
