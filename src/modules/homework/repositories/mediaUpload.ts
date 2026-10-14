/**
 * PUT một blob lên URL ký sẵn của object storage (không bearer, không JSON) bằng XMLHttpRequest để có tiến độ.
 * Ngoại lệ duy nhất không đi qua `request()` của client vì đây không phải API của Phonics Arcade.
 */
import { ErrorCode } from '@phonics/contracts';
import { ApiError, ClientErrorCode, HttpMethod } from '@/core/api/client';

export interface PutBlobOptions {
  headers: Record<string, string>;
  onProgress?: (ratio: number) => void;
  signal?: AbortSignal;
}

export function putBlob(
  url: string,
  blob: Blob,
  { headers, onProgress, signal }: PutBlobOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(HttpMethod.PUT, url);
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else
        reject(
          new ApiError(
            xhr.status,
            ErrorCode.enum.MEDIA_UPLOAD_INCOMPLETE,
            `Upload failed: HTTP ${xhr.status}`,
          ),
        );
    };
    xhr.onerror = () => reject(new ApiError(0, ClientErrorCode.NETWORK, 'Upload failed'));
    xhr.onabort = () => reject(new ApiError(0, ClientErrorCode.NETWORK, 'Upload aborted'));
    if (signal) {
      if (signal.aborted) xhr.abort();
      else signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.send(blob);
  });
}
