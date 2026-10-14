/**
 * Lớp phủ các màn React (Home / Setup / Results) lên canvas của game: cuộn dọc được,
 * nền tối nhẹ (theme đổi bằng biến --screen-layer-bg), thanh cuộn kiểu kẹo.
 */
import type { ReactNode } from 'react';
import styles from '@/ui/ScreenLayer/ScreenLayer.module.scss';

export default function ScreenLayer({ children }: { children: ReactNode }) {
  return <div className={styles.layer}>{children}</div>;
}
