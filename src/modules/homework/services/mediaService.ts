/**
 * Service media: xin URL ký sẵn → PUT blob → báo hoàn tất. Trả `MediaRef` (id + URL public) để gắn vào câu trả lời
 * và map media cục bộ (số liệu / ack → giữ DTO).
 */
import type { MediaKind, MediaRef } from '@phonics/contracts';
import { mediaRepository } from '@/modules/homework/repositories/mediaRepository';
import { putBlob } from '@/modules/homework/repositories/storageRepository';

export interface UploadOptions {
  kind: MediaKind;
  fileName: string;
  /** Gợi ý hiển thị (ảnh: kích thước; audio: thời lượng) */
  width?: number;
  height?: number;
  durationMs?: number;
  onProgress?: (ratio: number) => void;
  signal?: AbortSignal;
}

/** Bỏ tham số codec: `audio/webm;codecs=opus` → `audio/webm` (server so khớp kiểu gốc) */
const baseMime = (type: string): string => type.split(';')[0].trim();

export const mediaService = {
  async upload(blob: Blob, options: UploadOptions): Promise<MediaRef> {
    const mimeType = baseMime(blob.type) || (options.kind === 'IMAGE' ? 'image/png' : 'audio/webm');
    const presigned = await mediaRepository.presign({
      kind: options.kind,
      mimeType,
      sizeBytes: blob.size,
      fileName: options.fileName,
    });
    await putBlob(presigned.uploadUrl, blob, {
      headers: presigned.headers,
      onProgress: options.onProgress,
      signal: options.signal,
    });
    const view = await mediaRepository.complete(presigned.mediaId, {
      width: options.width,
      height: options.height,
      durationMs: options.durationMs,
    });
    return { id: view.id, url: view.url, kind: view.kind };
  },
};
