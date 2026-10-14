/**
 * Map media của phiếu (id → URL) cho renderer: JSON câu hỏi / câu trả lời chỉ giữ `*MediaId`, URL nằm trong
 * `media` của response (+ file bé vừa tải lên). Màn làm bài / kết quả bọc Provider, renderer tra bằng hook.
 */
import { createContext, useContext } from 'react';
import type { MediaMap, MediaRef } from '@phonics/contracts';

export const MediaMapContext = createContext<MediaMap>({});

export const useMedia = (id: string | null | undefined): MediaRef | undefined => {
  const map = useContext(MediaMapContext);
  return id ? map[id] : undefined;
};
