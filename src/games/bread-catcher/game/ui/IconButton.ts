/**
 * Nút icon tròn vẽ bằng Graphics (Pause / Back / End Game / phát âm...).
 * Vùng chạm tối thiểu 48x48 dù nút nhỏ hơn.
 */
import Phaser from 'phaser';
import { SFX, type SfxKey } from '@/core/audio/sfx';
import { getAudio } from '@/games/bread-catcher/game/core/services';

export type IconGlyph = 'pause' | 'back' | 'stop' | 'speaker';

const MIN_TOUCH = 48;
const INK = 0xffffff;

const COLORS: Record<IconGlyph, { fill: number; edge: number }> = {
  pause: { fill: 0xffa62b, edge: 0xc26a10 },
  back: { fill: 0x3f8cff, edge: 0x2458b8 },
  stop: { fill: 0xff4d5e, edge: 0xb8283a },
  speaker: { fill: 0x5ccf4a, edge: 0x2f8f2a },
};

function drawGlyph(g: Phaser.GameObjects.Graphics, glyph: IconGlyph, r: number): void {
  const s = r * 0.42;
  g.fillStyle(INK, 1);
  g.lineStyle(Math.max(2, r * 0.16), INK, 1);
  switch (glyph) {
    case 'pause':
      g.fillRoundedRect(-s * 0.8, -s, s * 0.55, s * 2, 2);
      g.fillRoundedRect(s * 0.25, -s, s * 0.55, s * 2, 2);
      break;
    case 'stop':
      g.fillRoundedRect(-s * 0.85, -s * 0.85, s * 1.7, s * 1.7, 3);
      break;
    case 'back':
      // Mũi tên vòng lại ↩
      g.beginPath();
      g.arc(s * 0.1, s * 0.15, s * 0.8, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(110), false);
      g.strokePath();
      g.fillTriangle(-s * 0.95, -s * 0.65, s * 0.15, -s * 1.35, s * 0.15, s * 0.05);
      break;
    case 'speaker':
      g.fillRect(-s, -s * 0.4, s * 0.6, s * 0.8);
      g.fillTriangle(-s * 0.5, -s * 0.4, s * 0.25, -s, s * 0.25, s);
      g.fillTriangle(-s * 0.5, s * 0.4, s * 0.25, -s, s * 0.25, s);
      g.beginPath();
      g.arc(s * 0.3, 0, s * 0.75, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45), false);
      g.strokePath();
      break;
  }
}

export default class IconButton extends Phaser.GameObjects.Container {
  private readonly face: Phaser.GameObjects.Graphics;
  private pressed = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    glyph: IconGlyph,
    private readonly onClick: () => void,
    { radius = 19, sfx = SFX.UI_CLICK as SfxKey | null } = {},
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    const { fill, edge } = COLORS[glyph];
    const base = scene.add.graphics();
    base.fillStyle(edge, 1).fillCircle(0, 3, radius);
    this.face = scene.add.graphics();
    this.face.fillStyle(fill, 1).fillCircle(0, 0, radius);
    this.face.lineStyle(3, 0x3b1a0b, 1).strokeCircle(0, 1.5, radius + 1);
    drawGlyph(this.face, glyph, radius);
    this.add([base, this.face]);

    const size = Math.max(radius * 2, MIN_TOUCH);
    this.setSize(size, size);
    this.setInteractive({ useHandCursor: true });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.pressed = true;
      this.face.y = 2;
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      this.pressed = false;
      this.face.y = 0;
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      if (!this.pressed) return;
      this.pressed = false;
      this.face.y = 0;
      if (sfx) getAudio(scene).playSfx(sfx);
      this.onClick();
    });
  }
}
