/**
 * Service lớp học: gọi `classesRepository` rồi đổi DTO → model (`PublicClassModel`).
 * Màn hình chỉ gọi service, không gọi repository trực tiếp.
 */
import { classesRepository } from '@/platform/account/api/classesRepository';
import { PublicClassModel } from '@/platform/account/models/PublicClassModel';

export const classesService = {
  /** Lớp giáo viên đang cho học sinh tự vào (form đăng ký) */
  publicList: async () =>
    (await classesRepository.publicList()).items.map((item) => new PublicClassModel(item)),
};
