import type { FamilyProfile } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { FamilyProfileModel } from '@/modules/auth/models/FamilyProfileModel';

const dto: FamilyProfile = {
  id: '22222222-2222-4222-8222-222222222222',
  displayName: 'Andy Nguyen',
  vietnameseName: 'Nguyễn Văn An',
  englishName: 'Andy Nguyen',
  avatarKey: 'pip',
  status: 'ACTIVE',
  class: {
    id: '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
    name: 'K2A',
    grade: 'K2',
    schoolYear: '2026-2027',
    joinedAt: '2026-09-01T00:00:00.000Z',
  },
  requestedClass: null,
  rejectReason: null,
};

describe('FamilyProfileModel', () => {
  it('bé đã duyệt: vào chơi được, dòng trạng thái là tên lớp', () => {
    const m = new FamilyProfileModel(dto);
    expect([m.canPlay, m.firstName, m.statusText]).toEqual([true, 'Andy', 'K2A']);
  });

  it('chờ duyệt / bị từ chối: không vào chơi được', () => {
    expect(new FamilyProfileModel({ ...dto, status: 'PENDING', class: null }).statusText).toBe(
      'WAITING FOR APPROVAL',
    );
    const rejected = new FamilyProfileModel({ ...dto, status: 'REJECTED', rejectReason: 'Trùng hồ sơ' });
    expect([rejected.canPlay, rejected.statusText, rejected.rejectReason]).toEqual([
      false,
      'NOT APPROVED',
      'Trùng hồ sơ',
    ]);
  });
});
