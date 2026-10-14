/**
 * Nút bo tròn có nhãn chữ vẽ live (không nướng chữ vào sprite). Nhấn thì lún xuống; cao ≥ 48px.
 */
import Phaser from 'phaser';
import { THEME } from '@/games/phonics-ocean/game/config/theme';
import { getAudio } from '@/games/phonics-ocean/game/core/services';
import { addText } from '@/games/phonics-ocean/game/ui/text';
import { SFX } from '@/core/audio/sfx';

export type PillColor = 'green' | 'teal' | 'orange' | 'white';

const PALETTE: Record<PillColor, { fill: number; edge: number; text: string }> = {
  green: { fill: 0x5ccf4a, edge: 0x2f8f2a, text: THEME.colors.white },
  teal: { fill: 0x20b8a6, edge: 0x137e72, text: THEME.colors.white },
  orange: { fill: 0xffa62b, edge: 0xc26a10, text: THEME.colors.white },
  white: { fill: 0xffffff, edge: 0xa9c7dc, text: THEME.colors.ink },
};

const EDGE = 5;
const RADIUS = 18;

export default class PillButton extends Phaser.GameObjects.Container {
  private readonly face: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    { color = 'green' as PillColor, width = 220, height = 54 } = {},
  ) {
    super(scene, x, y);
    const palette = PALETTE[color];
    const base = scene.add.graphics();
    base
      .fillStyle(THEME.hex.ink)
      .fillRoundedRect(-width / 2 - 3, -height / 2 - 3, width + 6, height + EDGE + 6, RADIUS + 2);
    base.fillStyle(palette.edge).fillRoundedRect(-width / 2, -height / 2 + EDGE, width, height, RADIUS);

    const top = scene.add.graphics();
    top.fillStyle(palette.fill).fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS);
    top
      .fillStyle(THEME.hex.white, 0.28)
      .fillRoundedRect(-width / 2 + 10, -height / 2 + 5, width - 20, height * 0.22, 6);
    const text = addText(scene, 0, 0, label, 'outline', {
      fontSize: '22px',
      color: palette.text,
      strokeThickness: color === 'white' ? 0 : 5,
    });
    this.face = scene.add.container(0, 0, [top, text]);
    this.add([base, this.face]);

    this.setSize(width, height + EDGE).setInteractive({ useHandCursor: true });
    this.on(Phaser.Input.Events.POINTER_DOWN, () => this.face.setY(EDGE - 1));
    this.on(Phaser.Input.Events.POINTER_OUT, () => this.face.setY(0));
    this.on(Phaser.Input.Events.POINTER_UP, () => {
      if (this.face.y === 0) return;
      this.face.setY(0);
      getAudio(scene).playSfx(SFX.UI_CLICK);
      onClick();
    });
    scene.add.existing(this);
  }
}
