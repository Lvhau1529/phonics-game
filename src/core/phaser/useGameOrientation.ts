/**
 * Hướng bố cục của game (dọc / ngang). Đổi hướng thì game dựng lại Phaser (PhaserHost key={orientation}),
 * nên khi `frozen` (đang chơi dở) thì giữ nguyên hướng cũ, chờ tới lúc không còn chơi mới đổi.
 */
import { useEffect, useState } from 'react';
import { currentOrientation, type Orientation } from '@/core/phaser/viewport';

export function useGameOrientation(frozen: boolean): Orientation {
  const [orientation, setOrientation] = useState(currentOrientation);
  useEffect(() => {
    if (frozen) return undefined;
    const sync = () => setOrientation(currentOrientation());
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [frozen]);
  return orientation;
}
