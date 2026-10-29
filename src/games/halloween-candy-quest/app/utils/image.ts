/**
 * Ảnh giáo viên upload cho từ tự thêm: kiểm tra định dạng / dung lượng, thu nhỏ còn tối đa 160px rồi lưu dạng
 * data URL (vừa localStorage). Ảnh không đọc được -> null.
 */
import { MAX_IMAGE_CHARS } from '@/games/halloween-candy-quest/content/schema';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 160;
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = url;
  });
}

export async function fileToWordImage(file: File): Promise<string | null> {
  if (!TYPES.includes(file.type) || file.size > MAX_FILE_BYTES) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // PNG giữ nền trong suốt; quá lớn (ảnh chụp) thì đổi sang JPEG
    const png = canvas.toDataURL('image/png');
    if (png.length <= MAX_IMAGE_CHARS) return png;
    const jpeg = canvas.toDataURL('image/jpeg', 0.85);
    return jpeg.length <= MAX_IMAGE_CHARS ? jpeg : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
