/**
 * Nút "kẹo" có nhãn chữ vẽ live (plan: không nướng chữ vào sprite).
 * Có gờ tối phía dưới, nhấn thì lún xuống; vùng chạm tối thiểu 48px (plan §34).
 */
import Phaser from 'phaser';
import { SFX, type SfxKey } from '@/core/audio/sfx';
import { THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { getAudio } from '@/games/bread-catcher/game/core/services';
import { addText } from '@/games/bread-catcher/game/ui/text';

export type ButtonColor = 'green' | 'blue' | 'red' | 'orange' | 'cream';

const PALETTE: Record<ButtonColor, { fill: number; edge: number; text: string }> = {
  green: { fill: 0x5ccf4a, edge: 0x2f8f2a, text: THEME.colors.white },
  blue: { fill: 0x3f8cff, edge: 0x2458b8, text: THEME.colors.white },
  red: { fill: 0xff4d5e, edge: 0xb8283a, text: THEME.colors.white },
  orange: { fill: 0xffa62b, edge: 0xc26a10, text: THEME.colors.white },
  cream: { fill: 0xfff4dc, edge: 0xd9b98a, text: THEME.colors.brown },
};

const EDGE = 5;
const RADIUS = 16;
const PADDING_X = 22;
const MIN_TOUCH = 48;

export interface TextButtonOptions {
  color?: ButtonColor;
  width?: number;
  height?: number;
  fontSize?: number;
  /** Âm thanh khi bấm; `null` = im lặng */
  sfx?: SfxKey | null;
}

export default class TextButton extends Phaser.GameObjects.Container {
  private readonly face: Phaser.GameObjects.Container;
  private pressed = false;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    private readonly onClick: () => void,
    private readonly options: TextButtonOptions = {},
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    const { color = 'orange', height = 52, fontSize = 20 } = options;
    const palette = PALETTE[color];
    const text = addText(scene, 0, -EDGE / 2, label, 'outline', {
      fontSize: `${fontSize}px`,
      fontStyle: '800',
      color: palette.text,
      strokeThickness: color === 'cream' ? 0 : 4,
      stroke: '#00000055',
    });
    const width = options.width ?? Math.max(120, text.width + PADDING_X * 2);

    const edge = scene.add.graphics();
    edge.fillStyle(palette.edge, 1).fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS);
    const face = scene.add.graphics();
    face.fillStyle(palette.fill, 1).fillRoundedRect(-width / 2, -height / 2, width, height - EDGE, RADIUS);
    face.fillStyle(0xffffff, 0.25).fillRoundedRect(-width / 2 + 8, -height / 2 + 5, width - 16, 8, 4);
    face.lineStyle(3, 0x3b1a0b, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS);

    this.face = scene.add.container(0, 0, [face, text]);
    this.add([edge, this.face]);

    this.setSize(width, Math.max(height, MIN_TOUCH));
    this.setInteractive({ useHandCursor: true });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.press, this);
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, this.release, this);
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, this.click, this);
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : 0.5);
    return this;
  }

  /** Gọi nút bằng bàn phím */
  trigger(): void {
    if (!this.enabled || !this.visible) return;
    this.playSfx();
    this.onClick();
  }

  private press(): void {
    if (!this.enabled) return;
    this.pressed = true;
    this.face.y = EDGE - 1;
  }

  private release(): void {
    this.pressed = false;
    this.face.y = 0;
  }

  private click(): void {
    if (!this.pressed) return;
    this.release();
    this.trigger();
  }

  private playSfx(): void {
    const sfx = this.options.sfx === undefined ? SFX.UI_CLICK : this.options.sfx;
    if (sfx) getAudio(this.scene).playSfx(sfx);
  }
}
