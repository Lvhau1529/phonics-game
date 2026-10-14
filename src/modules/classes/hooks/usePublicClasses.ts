/** Lớp giáo viên đang cho học sinh tự vào (form đăng ký) — màn / component chỉ dùng hook này, không gọi service */
import { useRequest } from '@/core/hooks/useRequest';
import { classesService } from '@/modules/classes/services/classesService';

export const usePublicClasses = () => useRequest(() => classesService.publicList(), 'classes');
