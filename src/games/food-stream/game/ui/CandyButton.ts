/**
 * Nút "kẹo" có nhãn chữ vẽ live (không nướng chữ vào sprite). Nhấn thì lún xuống; cao ≥ 48px.
 */
import Phaser from 'phaser';
import { THEME } from '@/games/food-stream/game/config/theme';
import { getAudio } from '@/games/food-stream/game/core/services';
import { addText } from '@/games/food-stream/game/ui/text';
import { SFX } from '@/core/audio/sfx';

export type CandyColor = 'pink' | 'blue' | 'green' | 'white';

const PALETTE: Record<CandyColor, { fill: number; edge: number; text: string }> = {
  pink: { fill: 0xff6f9c, edge: 0xd9446f, text: THEME.colors.white },
  blue: { fill: 0x3f8cff, edge: 0x2458b8, text: THEME.colors.white },
  green: { fill: 0x39c16c, edge: 0x238a4a, text: THEME.colors.white },
  white: { fill: 0xffffff, edge: 0xd8c8e8, text: THEME.colors.ink },
};

const EDGE = 5;
const RADIUS = 16;

export default class CandyButton extends Phaser.GameObjects.Container {
  private readonly face: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    { color = 'pink' as CandyColor, width = 200, height = 54 } = {},
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
      .fillRoundedRect(-width / 2 + 8, -height / 2 + 5, width - 16, height * 0.22, 6);
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
