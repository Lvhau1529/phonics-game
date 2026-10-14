/**
 * Quyển vở (SVG inline, màu theo `currentColor`) — nút HOMEWORK ở màn chọn game / hồ sơ.
 */
import type { SVGProps } from 'react';

export default function BookIcon({ size = 24, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="M6 2h11a3 3 0 0 1 3 3v14.5a1.5 1.5 0 0 1-1.5 1.5H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v10.2c.31-.13.65-.2 1-.2h12V5a1 1 0 0 0-1-1H6Zm0 13a1 1 0 0 0 0 2h12v-2H6Zm2-10h7a1 1 0 1 1 0 2H8a1 1 0 0 1 0-2Zm0 4h5a1 1 0 1 1 0 2H8a1 1 0 0 1 0-2Z" />
    </svg>
  );
}
