/**
 * Màu "kẹo" có gờ trong theme (mỗi màu có --color-<tên> và --color-<tên>-edge, xem styles/tailwind.css).
 * Component nhận prop `tone` rồi gắn qua biến CSS — không cần class riêng cho từng màu.
 */
import type { CSSProperties } from 'react';

export type ToneColor = 'orange' | 'green' | 'blue' | 'red' | 'pink' | 'teal' | 'purple';

/** `--tone` / `--tone-edge` cho style inline (OptionGroup đọc hai biến này) */
export function toneVars(tone: ToneColor): CSSProperties {
  return {
    '--tone': `var(--color-${tone})`,
    '--tone-edge': `var(--color-${tone}-edge)`,
  } as CSSProperties;
}
