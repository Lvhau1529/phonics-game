import type { LevelId } from '@/games/bread-catcher/session/types';
import type { ToneColor } from '@/ui/tone';

/** Màu của từng cấp độ (chip LEVEL ở Setup, thẻ cấp độ trong Hướng dẫn): chậm -> nhanh = xanh -> đỏ */
export const LEVEL_TONE: Record<LevelId, ToneColor> = {
  gentle: 'teal',
  easy: 'green',
  normal: 'blue',
  fast: 'orange',
  hard: 'red',
};
