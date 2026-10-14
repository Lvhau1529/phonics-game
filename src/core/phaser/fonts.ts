/**
 * Font dùng chung (nạp ở src/main.tsx): Baloo 2 cho giao diện, Andika cho chữ học
 * (chữ cái, từ vựng — font dành cho trẻ tập đọc).
 */
export const FONTS = {
  ui: '"Baloo 2", "Arial Rounded MT Bold", sans-serif',
  learning: 'Andika, "Comic Sans MS", sans-serif',
} as const;

const REQUIRED = [
  `600 20px ${FONTS.ui}`,
  `700 20px ${FONTS.ui}`,
  `800 20px ${FONTS.ui}`,
  `700 20px ${FONTS.learning}`,
];

/** Canvas không tự chờ web font: gọi ở BootScene trước khi vẽ chữ. Font lỗi thì dùng font dự phòng. */
export async function loadFonts(): Promise<void> {
  await Promise.all(REQUIRED.map((font) => document.fonts.load(font))).catch(() => undefined);
}
