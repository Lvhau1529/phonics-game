/**
 * Chuông thông báo (SVG inline, màu theo `currentColor`) — nút MESSAGES / chuông ở màn chọn game.
 */
import type { SVGProps } from 'react';

export default function BellIcon({ size = 24, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
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
      <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v.7A6.5 6.5 0 0 1 18.5 10.5V15l1.6 2.4a1 1 0 0 1-.83 1.55H4.73a1 1 0 0 1-.83-1.55L5.5 15v-4.5A6.5 6.5 0 0 1 10.5 4.2v-.7A1.5 1.5 0 0 1 12 2Zm-2.9 18h5.8a2.9 2.9 0 0 1-5.8 0Z" />
    </svg>
  );
}
