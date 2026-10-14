/**
 * Đếm ngược dùng lại được: đầu lượt ("GET READY! 3 2 1 GO!" — plan §7)
 * và khi Resume sau Pause ("3 2 1 GO!" — plan §19).
 * Dùng clock của scene: scene bị pause thì đếm ngược cũng dừng.
 */
import type Phaser from 'phaser';
import { SFX } from '@/core/audio/sfx';
import { DEPTH, THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { getAudio } from '@/games/bread-catcher/game/core/services';
import { view } from '@/core/phaser/view';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import { addText } from '@/games/bread-catcher/game/ui/text';

interface Step {
  text: string;
  duration: number;
  color: string;
  size: number;
  sfx: typeof SFX.COUNTDOWN_TICK | typeof SFX.COUNTDOWN_GO | null;
}

const { colors } = THEME;

/** Thời lượng theo plan §7 */
const GET_READY: Step = { text: UI_TEXT.getReady, duration: 600, color: colors.gold, size: 40, sfx: null };
const NUMBERS: Step[] = [
  { text: '3', duration: 700, color: colors.pink, size: 96, sfx: SFX.COUNTDOWN_TICK },
  { text: '2', duration: 700, color: colors.blue, size: 96, sfx: SFX.COUNTDOWN_TICK },
  { text: '1', duration: 700, color: colors.orange, size: 96, sfx: SFX.COUNTDOWN_TICK },
];
const GO: Step = { text: UI_TEXT.go, duration: 500, color: colors.green, size: 84, sfx: SFX.COUNTDOWN_GO };

export interface CountdownOptions {
  /** Thêm "GET READY!" trước 3-2-1 (đầu lượt) */
  withGetReady?: boolean;
  depth?: number;
}

export function playCountdown(
  scene: Phaser.Scene,
  { withGetReady = false, depth = DEPTH.BANNER }: CountdownOptions = {},
): Promise<void> {
  const steps = [...(withGetReady ? [GET_READY] : []), ...NUMBERS, GO];
  const { width, height } = view(scene);
  const audio = getAudio(scene);

  return new Promise((resolve) => {
    let index = 0;
    const next = () => {
      const step = steps[index];
      if (!step) {
        resolve();
        return;
      }
      index += 1;
      if (step.sfx) audio.playSfx(step.sfx);

      const label = addText(scene, width / 2, height * 0.46, step.text, 'title', {
        fontSize: `${step.size}px`,
        color: step.color,
        strokeThickness: step.size > 60 ? 12 : 8,
      }).setDepth(depth);
      scene.tweens.add({
        targets: label,
        scale: { from: 0.3, to: 1 },
        duration: 260,
        ease: 'Back.easeOut',
      });
      scene.tweens.add({
        targets: label,
        alpha: 0,
        scale: 1.25,
        delay: step.duration - 160,
        duration: 150,
        onComplete: () => label.destroy(),
      });
      scene.time.delayedCall(step.duration, next);
    };
    next();
  });
}
