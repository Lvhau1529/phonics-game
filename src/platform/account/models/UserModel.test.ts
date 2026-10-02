import { User } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { UserModel } from '@/platform/account/models/UserModel';

const dto: User = {
  id: '0b1e6f2e-1c3a-4e5b-9d7f-123456789abc',
  email: 'kid@example.com',
  role: 'STUDENT',
  status: 'ACTIVE',
  provider: 'LOCAL',
  displayName: 'Minh Anh',
  avatarKey: 'pip',
  class: {
    id: '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
    name: 'K2A',
    grade: 'Grade 2',
    schoolYear: '2026-2027',
    joinedAt: '2026-09-01T00:00:00.000Z',
  },
  createdAt: '2026-09-01T00:00:00.000Z',
};

describe('UserModel', () => {
  it('giữ nguyên field như DTO', () => {
    const user = new UserModel(dto);
    expect(user.id).toBe(dto.id);
    expect(user.displayName).toBe(dto.displayName);
    expect(user.class).toEqual(dto.class);
  });

  it('firstName = từ đầu tiên của displayName (bỏ khoảng trắng thừa)', () => {
    expect(new UserModel(dto).firstName).toBe('Minh');
    expect(new UserModel({ ...dto, displayName: '  Minh   Anh ' }).firstName).toBe('Minh');
    expect(new UserModel({ ...dto, displayName: 'Kid' }).firstName).toBe('Kid');
  });

  it('hasClass / className theo lớp hiện tại', () => {
    const user = new UserModel(dto);
    expect(user.hasClass).toBe(true);
    expect(user.className).toBe('K2A');

    const noClass = new UserModel({ ...dto, class: null });
    expect(noClass.hasClass).toBe(false);
    expect(noClass.className).toBeNull();
  });

  it('round-trip: toJSON -> JSON -> User.parse -> new UserModel giữ nguyên dữ liệu + getter', () => {
    const user = new UserModel(dto);
    const stored: unknown = JSON.parse(JSON.stringify(user.toJSON()));
    const restored = new UserModel(User.parse(stored));
    expect(restored).toBeInstanceOf(UserModel);
    expect(restored.toJSON()).toEqual(user.toJSON());
    expect(restored.firstName).toBe('Minh');
    // JSON.stringify(model) dùng toJSON -> không lẫn getter vào bản lưu
    expect(JSON.parse(JSON.stringify(user))).toEqual(dto);
  });
});
