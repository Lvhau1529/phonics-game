/**
 * Chữ "G" của Google (SVG inline một màu, `currentColor`) — nút dự phòng khi script Google chưa tải xong.
 */
import type { SVGProps } from 'react';

export default function GoogleG({ size = 20, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
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
      <path d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.7h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.32 2.98-7.26Z" />
      <path d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.06v2.58A10 10 0 0 0 12 22Z" />
      <path d="M6.41 13.9A6 6 0 0 1 6.1 12c0-.66.11-1.3.31-1.9V7.52H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.48l3.35-2.58Z" />
      <path d="M12 5.98c1.47 0 2.79.5 3.82 1.5l2.87-2.87A10 10 0 0 0 12 2a10 10 0 0 0-8.94 5.52l3.35 2.58C7.2 7.74 9.4 5.98 12 5.98Z" />
    </svg>
  );
}
