/** Tải ảnh tô chữ / file ghi âm của bé lên (component chỉ dùng hook này, không gọi service) */
import { mediaService, type UploadOptions } from '@/modules/homework/services/mediaService';

export type { UploadOptions };

export const useMediaUpload = () => mediaService.upload;
