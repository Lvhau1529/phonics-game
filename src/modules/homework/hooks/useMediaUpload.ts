/** Tải ảnh tô chữ / file ghi âm của bé lên (component chỉ dùng hook này, không gọi service) */
import { createContext, useContext } from 'react';
import { mediaService, type UploadOptions } from '@/modules/homework/services/mediaService';

export type { UploadOptions };

export type MediaUploader = typeof mediaService.upload;

/** Mặc định tải lên server; màn xem trước (#/preview) thay bằng bản cục bộ, không gọi API */
export const MediaUploadContext = createContext<MediaUploader>(mediaService.upload);

export const useMediaUpload = (): MediaUploader => useContext(MediaUploadContext);
