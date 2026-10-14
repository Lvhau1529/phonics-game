/**
 * Repository media (ảnh tô chữ, file ghi âm của bé): chỉ khai báo endpoint và trả DTO đúng như BE.
 * Byte file KHÔNG đi qua API: client PUT thẳng lên URL ký sẵn (`mediaUpload.ts`).
 */
import {
  ENDPOINTS,
  MediaView,
  PresignMediaResponse,
  type CompleteMediaBody,
  type PresignMediaBody,
} from '@phonics/contracts';
import { HttpMethod, request } from '@/platform/api/client';

export const mediaRepository = {
  presign: (body: PresignMediaBody) =>
    request(ENDPOINTS.media.presign, { method: HttpMethod.POST, body, schema: PresignMediaResponse }),
  complete: (id: string, body: CompleteMediaBody) =>
    request(ENDPOINTS.media.complete(id), { method: HttpMethod.POST, body, schema: MediaView }),
};
