/**
 * Đọc / ghi JSON trong localStorage, an toàn khi storage bị chặn (private mode, iframe...):
 * lỗi thì trả về null / bỏ qua — dữ liệu vẫn còn trong bộ nhớ của phiên hiện tại.
 *
 * Mỗi game dùng key riêng dạng `phonics-arcade:<game-id>` để không đụng dữ liệu của nhau.
 */
export function readJson<T>(key: string): Partial<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' ? (value as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage không khả dụng
  }
}

export function removeKeys(keys: readonly string[]): void {
  try {
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage không khả dụng
  }
}

/** Key lưu dữ liệu của một game */
export const gameStorageKey = (gameId: string): string => `phonics-arcade:${gameId}`;
