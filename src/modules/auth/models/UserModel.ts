import type {
  AuthProvider,
  AvatarKey,
  LoginMethods,
  Role,
  StudentClassRef,
  User,
  UserStatus,
} from '@phonics/contracts';

/**
 * Người dùng đang đăng nhập (từ `User` của BE). Field giữ nguyên tên như contracts; getter là dữ liệu chỉ phía FE
 * dùng. Lưu localStorage bằng `toJSON()`, đọc lại: `User.safeParse` rồi `new UserModel(...)`.
 */
export class UserModel {
  readonly id: string;
  /** null với học sinh (bé không có thông tin đăng nhập — vào qua tài khoản gia đình) */
  readonly email: string | null;
  readonly role: Role;
  readonly status: UserStatus;
  readonly provider: AuthProvider;
  readonly displayName: string;
  readonly avatarKey: AvatarKey;
  /** Chỉ có với STUDENT, null khi chưa vào lớp */
  readonly class: StudentClassRef | null;
  readonly createdAt: string;
  /** API cũ không trả → suy theo `provider` */
  readonly loginMethods: LoginMethods | undefined;

  constructor(data: User) {
    this.id = data.id;
    this.email = data.email;
    this.role = data.role;
    this.status = data.status;
    this.provider = data.provider;
    this.displayName = data.displayName;
    this.avatarKey = data.avatarKey;
    this.class = data.class;
    this.createdAt = data.createdAt;
    this.loginMethods = data.loginMethods;
  }

  /** Tài khoản gia đình (phụ huynh) */
  get isParent(): boolean {
    return this.role === 'PARENT';
  }

  /** Hồ sơ bé (phiên do phụ huynh mở) */
  get isStudent(): boolean {
    return this.role === 'STUDENT';
  }

  /** Tên gọi ngắn (từ đầu tiên của displayName) cho nút ở màn chọn game */
  get firstName(): string {
    return this.displayName.trim().split(/\s+/)[0] ?? '';
  }

  get hasClass(): boolean {
    return this.class !== null;
  }

  /** Tên lớp hiện tại (null khi chưa vào lớp) */
  get className(): string | null {
    return this.class?.name ?? null;
  }

  /** Có mật khẩu (đăng nhập email) */
  get hasPassword(): boolean {
    return this.loginMethods?.password ?? this.provider === 'LOCAL';
  }

  /** Đã liên kết Google */
  get hasGoogle(): boolean {
    return this.loginMethods?.google ?? this.provider === 'GOOGLE';
  }

  /** DTO đúng như BE (lưu localStorage / tạo bản mới) */
  toJSON(): User {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      status: this.status,
      provider: this.provider,
      displayName: this.displayName,
      avatarKey: this.avatarKey,
      class: this.class,
      createdAt: this.createdAt,
      loginMethods: this.loginMethods,
    };
  }
}
