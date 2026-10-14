/**
 * Phần dùng chung cho các scene overlay (Pause, Turn Complete, hộp thoại xác nhận):
 * nền tối + panel kem.
 */
import type Phaser from 'phaser';
import { DEPTH } from '@/games/bread-catcher/game/config/gameConfig';
import { view } from '@/core/phaser/view';
import Panel from '@/games/bread-catcher/game/ui/Panel';
import TextButton from '@/games/bread-catcher/game/ui/TextButton';
import { addText } from '@/games/bread-catcher/game/ui/text';
import { UI_TEXT } from '@/games/bread-catcher/session/text';

/** Kích thước phần đỉnh (kem + nơ) / đáy của panel_large không được kéo giãn */
const PANEL_SLICES = { top: 72, bottom: 30 };

/** Nền tối phủ kín màn hình, chặn input xuyên xuống scene bên dưới */
export function createDim(scene: Phaser.Scene, alpha = 0.6): Phaser.GameObjects.Rectangle {
  const { width, height } = view(scene);
  const dim = scene.add
    .rectangle(width / 2, height / 2, width * 2, height * 2, 0x1e0c04, alpha)
    .setDepth(DEPTH.OVERLAY)
    .setInteractive();
  scene.tweens.add({ targets: dim, alpha: { from: 0, to: 1 }, duration: 200 });
  return dim;
}

export function createPanel(scene: Phaser.Scene, panelHeight: number, centerYRatio = 0.48): Panel {
  const { width, height } = view(scene);
  const panel = new Panel(scene, width / 2, height * centerYRatio, 'panel_large', panelHeight, PANEL_SLICES);
  panel.setDepth(DEPTH.OVERLAY + 1);
  scene.tweens.add({
    targets: panel,
    scale: { from: 0.85, to: 1 },
    alpha: { from: 0, to: 1 },
    duration: 260,
    ease: 'Back.easeOut',
  });
  return panel;
}

export interface ConfirmOptions {
  title: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Tự phủ nền tối (tắt khi scene đã có nền tối riêng, vd: Pause) */
  withDim?: boolean;
}

/** Hộp thoại "LEAVE THIS GAME?" / "END GAME?" (plan §20) */
export function showConfirm(scene: Phaser.Scene, options: ConfirmOptions): Panel {
  const dim = options.withDim === false ? null : createDim(scene);
  const panel = createPanel(scene, 250);
  const close = (action: () => void) => {
    dim?.destroy();
    panel.destroy();
    action();
  };
  panel.add([
    addText(scene, 0, panel.top + 104, options.title, 'heading', { fontSize: '24px' }),
    new TextButton(scene, -70, panel.top + 180, UI_TEXT.cancel, () => close(options.onCancel), {
      color: 'blue',
      width: 124,
    }),
    new TextButton(scene, 70, panel.top + 180, options.confirmLabel, () => close(options.onConfirm), {
      color: 'red',
      width: 124,
    }),
  ]);
  return panel;
}
