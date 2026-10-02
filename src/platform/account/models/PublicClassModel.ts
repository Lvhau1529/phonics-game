import type { PublicClass } from '@phonics/contracts';

/**
 * Lớp đang cho học sinh tự vào (từ `PublicClass` của BE, GET /public/classes) — lựa chọn ở form đăng ký.
 * Field giữ nguyên tên như contracts; getter là dữ liệu chỉ phía FE dùng.
 */
export class PublicClassModel {
  readonly id: string;
  readonly name: string;
  readonly grade: string;
  readonly schoolYear: string;

  constructor(data: PublicClass) {
    this.id = data.id;
    this.name = data.name;
    this.grade = data.grade;
    this.schoolYear = data.schoolYear;
  }

  /** Dòng phụ trong ô chọn lớp: "Grade 2 · 2026-2027" */
  get subtitle(): string {
    return `${this.grade} · ${this.schoolYear}`;
  }
}
