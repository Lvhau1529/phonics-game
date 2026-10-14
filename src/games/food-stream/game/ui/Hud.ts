/**
 * Thanh livestream phía trên (plan §12): LIVE · người xem · tim · (đồng hồ) · nút tạm dừng.
 * Người xem / tim chỉ là phần thưởng hình ảnh — không có mạng thật.
 */
import Phaser from 'phaser';
import { DEPTH, THEME } from '@/games/food-stream/game/config/theme';
import { addText } from '@/games/food-stream/game/ui/text';
import { compactNumber, formatTime } from '@/core/utils/format';

const PILL_HEIGHT = 26;
const GAP = 6;

export default class Hud extends Phaser.GameObjects.Container {
  private readonly viewersText: Phaser.GameObjects.Text;
  private readonly heartsText: Phaser.GameObjects.Text;
  private readonly heartIcon: Phaser.GameObjects.Image;
  private readonly timerText: Phaser.GameObjects.Text | null = null;
  private shownViewers = 0;
  private viewersTween: Phaser.Tweens.Tween | null = null;

  constructor(
    scene: Phaser.Scene,
    area: Phaser.Geom.Rectangle,
    { showTimer, onPause }: { showTimer: boolean; onPause: () => void },
  ) {
    super(scene, 0, 0);
    this.setDepth(DEPTH.HUD);
    const y = area.centerY;
    let x = area.x + 8;

    const live = scene.add.image(x, y, 'ui.live').setOrigin(0, 0.5);
    live.setScale(PILL_HEIGHT / live.height);
    this.add(live);
    scene.tweens.add({ targets: live, alpha: 0.7, duration: 600, yoyo: true, repeat: -1 });
    x += live.displayWidth + GAP;

    // Người xem
    const viewers = this.pill(x, y, 72);
    const eye = scene.add.graphics({ x: x + 14, y });
    eye.fillStyle(THEME.hex.white).fillEllipse(0, 0, 16, 10);
    eye.fillStyle(THEME.hex.ink).fillCircle(0, 0, 3);
    this.viewersText = addText(scene, x + 46, y, '0', 'outline', { fontSize: '14px' });
    this.add([viewers, eye, this.viewersText]);
    x += 72 + GAP;

    // Tim
    const hearts = this.pill(x, y, 62);
    this.heartIcon = scene.add.image(x + 13, y, 'ui.heart');
    this.heartIcon.setScale(16 / this.heartIcon.height);
    this.heartsText = addText(scene, x + 38, y, '0', 'outline', { fontSize: '14px' });
    this.add([hearts, this.heartIcon, this.heartsText]);
    x += 62 + GAP;

    if (showTimer) {
      const timer = this.pill(x, y, 70);
      const clock = scene.add.image(x + 13, y, 'ui.stopwatch');
      clock.setScale(18 / clock.height);
      this.timerText = addText(scene, x + 42, y, '00:00', 'outline', { fontSize: '14px' });
      this.add([timer, clock, this.timerText]);
    }

    const pause = scene.add.image(area.right - 8, y, 'ui.btn.pause').setOrigin(1, 0.5);
    pause.setScale(36 / pause.height).setInteractive({ useHandCursor: true });
    pause.on(Phaser.Input.Events.POINTER_DOWN, onPause);
    this.add(pause);
    scene.add.existing(this);
  }

  /** Số người xem chạy lên dần */
  setViewers(value: number): void {
    this.viewersTween?.stop();
    const counter = { value: this.shownViewers };
    this.viewersTween = this.scene.tweens.add({
      targets: counter,
      value,
      duration: 700,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        this.shownViewers = Math.round(counter.value);
        this.viewersText.setText(compactNumber(this.shownViewers));
      },
    });
  }

  setHearts(value: number): void {
    this.heartsText.setText(compactNumber(value));
    this.scene.tweens.add({
      targets: this.heartIcon,
      scale: this.heartIcon.scale * 1.4,
      duration: 120,
      yoyo: true,
    });
  }

  setTime(remainingMs: number): void {
    this.timerText
      ?.setText(formatTime(remainingMs))
      .setColor(remainingMs <= 10_000 ? THEME.colors.red : THEME.colors.white);
  }

  private pill(x: number, y: number, width: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.fillStyle(0x2b1740, 0.85).fillRoundedRect(x, y - PILL_HEIGHT / 2, width, PILL_HEIGHT, PILL_HEIGHT / 2);
    return g;
  }
}
