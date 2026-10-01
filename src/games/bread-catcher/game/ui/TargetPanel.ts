/**
 * Ô từ mục tiêu dưới HUD (plan §9, §27):
 *
 *   ┌─────────────────────────────────┐
 *   │ ┌─────┐       M A P             │  <- từ (tuỳ mức gợi ý)
 *   │ │tranh│🔊  [M] [A] [_]           │  <- ô chữ, ô đang cần hứng sáng viền vàng
 *   └─────────────────────────────────┘
 *
 * Mức gợi ý: full (từ + chữ mờ trong ô) · word (từ) · first-letter (chữ đầu) · blank.
 * Từ có tranh (Kids Bakery pack: Picture Vocabulary, phần lớn Blending Words) hiện tranh bên trái
 * ở mọi mức gợi ý, chạm tranh để nghe lại từ; từ không có tranh chỉ có nút phát âm như cũ.
 * Chữ học dùng font Andika (plan §34).
 */
import Phaser from 'phaser';
import { WORD_ATLAS, WORD_PICTURE_SCALE, wordPictureFrame } from '@/games/bread-catcher/game/config/assets';
import { DEPTH, THEME } from '@/games/bread-catcher/game/config/gameConfig';
import type { GameEventBus } from '@/games/bread-catcher/game/core/events';
import IconButton from '@/games/bread-catcher/game/ui/IconButton';
import { hudLayout } from '@/games/bread-catcher/game/ui/layout';
import { addText } from '@/games/bread-catcher/game/ui/text';
import type { TargetSupport } from '@/games/bread-catcher/session/types';

const RADIUS = 18;
const SLOT_GAP = 6;
/** Từ dài (alligator, astronaut...) dùng khoảng cách ô hẹp hơn */
const LONG_WORD = 7;
const LONG_SLOT_GAP = 3;
const MAX_SLOT = 44;
/** Chừa chỗ bên trái cho nút phát âm */
const SPEAKER_SPACE = 58;
/** ...hoặc cho khung tranh (tranh 2x cạnh dài ≤ 128px -> hiển thị ≤ 64px) */
const PICTURE_SPACE = 88;
const PICTURE_BOX = 70;
const PICTURE_MARGIN = 10;
/** Nút phát âm thu nhỏ ở góc khung tranh */
const SPEAKER_BADGE_SCALE = 0.7;

interface Slot {
  box: Phaser.GameObjects.Graphics;
  hint: Phaser.GameObjects.Text;
  letter: Phaser.GameObjects.Text;
  x: number;
  size: number;
}

export default class TargetPanel {
  private readonly root: Phaser.GameObjects.Container;
  private readonly wordText: Phaser.GameObjects.Text;
  private readonly glow: Phaser.GameObjects.Graphics;
  private slots: Slot[] = [];
  private slotsRoot: Phaser.GameObjects.Container;
  private word = '';
  private current = 0;
  private cursorTween: Phaser.Tweens.Tween | null = null;
  private readonly panelWidth: number;
  private readonly centerX: number;
  private readonly pictureWell: Phaser.GameObjects.Graphics;
  private readonly picture: Phaser.GameObjects.Image | null;
  private readonly speaker: IconButton | null;
  /** Chỗ chừa bên trái của từ hiện tại (khung tranh hoặc nút phát âm) */
  private leftSpace = SPEAKER_SPACE;

  constructor(
    private readonly scene: Phaser.Scene,
    bus: GameEventBus,
    /** Có nút phát âm lại (khi có giọng đọc) */
    onSpeak: (() => void) | null,
  ) {
    const { panel } = hudLayout(scene);
    const { width: panelWidth, height: panelHeight } = panel;
    this.panelWidth = panelWidth;
    this.centerX = panel.x;
    this.root = scene.add.container(panel.x, panel.y + panelHeight / 2).setDepth(DEPTH.HUD);

    this.glow = scene.add.graphics().setAlpha(0);
    this.glow.fillStyle(0xffd23f, 1);
    this.glow.fillRoundedRect(
      -panelWidth / 2 - 5,
      -panelHeight / 2 - 5,
      panelWidth + 10,
      panelHeight + 10,
      RADIUS + 4,
    );

    const frame = scene.add.graphics();
    frame
      .fillStyle(0xfff4dc, 0.97)
      .fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, RADIUS);
    frame
      .lineStyle(4, 0x3b1a0b, 1)
      .strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, RADIUS);

    this.wordText = addText(scene, SPEAKER_SPACE / 2, -24, '', 'learning', { fontSize: '26px' });
    this.slotsRoot = scene.add.container(0, 0);

    const pictureX = -panelWidth / 2 + PICTURE_MARGIN + PICTURE_BOX / 2;
    this.pictureWell = scene.add.graphics({ x: pictureX }).setVisible(false);
    this.pictureWell
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-PICTURE_BOX / 2, -PICTURE_BOX / 2, PICTURE_BOX, PICTURE_BOX, 14)
      .lineStyle(3, 0xd9b98a, 1)
      .strokeRoundedRect(-PICTURE_BOX / 2, -PICTURE_BOX / 2, PICTURE_BOX, PICTURE_BOX, 14);
    this.picture = scene.textures.exists(WORD_ATLAS.key)
      ? scene.add.image(pictureX, 0, WORD_ATLAS.key).setVisible(false)
      : null;
    if (this.picture && onSpeak) {
      this.picture.setInteractive({ useHandCursor: true });
      this.picture.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        this.wiggle();
        onSpeak();
      });
    }
    this.speaker = onSpeak
      ? new IconButton(scene, -panelWidth / 2 + 30, 0, 'speaker', onSpeak, { radius: 20, sfx: null })
      : null;

    this.root.add([this.glow, frame, this.pictureWell]);
    if (this.picture) this.root.add(this.picture);
    this.root.add([this.wordText, this.slotsRoot]);
    if (this.speaker) this.root.add(this.speaker);

    bus
      .on('word-started', ({ word, support }) => this.showWord(word, support))
      .on('letter-filled', ({ index }) => this.fill(index))
      .on('word-finished', ({ correct }) => (correct ? this.celebrate() : this.fail()));
  }

  private showWord(word: string, support: TargetSupport): void {
    this.word = word;
    this.current = 0;
    this.slotsRoot.removeAll(true);
    this.cursorTween?.stop();

    this.showPicture(word);
    const showWord = support === 'full' || support === 'word';
    const isLong = word.length > LONG_WORD;
    this.wordText
      .setText(showWord ? word.split('').join(isLong ? '' : ' ') : '')
      .setVisible(showWord)
      .setFontSize(isLong ? 22 : 26)
      .setX(this.leftSpace / 2);

    const gap = isLong ? LONG_SLOT_GAP : SLOT_GAP;
    const available = this.panelWidth - this.leftSpace - 20;
    const size = Math.min(MAX_SLOT, Math.floor((available - gap * (word.length - 1)) / word.length));
    const rowWidth = word.length * size + (word.length - 1) * gap;
    const startX = this.leftSpace / 2 - rowWidth / 2 + size / 2;
    const y = showWord ? 14 : 0;

    this.slots = word.split('').map((char, index) => {
      const x = startX + index * (size + gap);
      const box = this.scene.add.graphics();
      const showHint = support === 'full' || (support === 'first-letter' && index === 0);
      const hint = addText(this.scene, x, y, showHint ? char : '', 'learning', {
        fontSize: `${Math.round(size * 0.72)}px`,
        color: '#b9a58a',
      });
      const letter = addText(this.scene, x, y, '', 'learning', { fontSize: `${Math.round(size * 0.78)}px` });
      this.slotsRoot.add([box, hint, letter]);
      return { box, hint, letter, x, size };
    });
    this.slotsRoot.y = 0;
    this.slots.forEach((slot, index) => this.drawSlot(slot, index === 0 ? 'current' : 'empty', y));
    this.pointCursor();

    // Hiện ra từ trên xuống
    this.root.setScale(1);
    this.scene.tweens.add({ targets: this.slotsRoot, alpha: { from: 0, to: 1 }, duration: 200 });
    this.scene.tweens.add({
      targets: this.wordText,
      scale: { from: 1.3, to: 1 },
      duration: 250,
      ease: 'Back.easeOut',
    });
  }

  /** Tranh của từ (nếu có) + vị trí nút phát âm: góc khung tranh, hoặc giữa chỗ trống bên trái */
  private showPicture(word: string): void {
    const frame = wordPictureFrame(word);
    const hasPicture = !!this.picture && this.scene.textures.get(WORD_ATLAS.key).has(frame);
    const left = -this.panelWidth / 2;
    this.leftSpace = hasPicture ? PICTURE_SPACE : SPEAKER_SPACE;
    this.pictureWell.setVisible(hasPicture);

    if (this.picture) {
      this.scene.tweens.killTweensOf(this.picture);
      this.picture.setVisible(hasPicture).setAngle(0);
      if (hasPicture) {
        this.picture.setFrame(frame).setScale(0);
        this.scene.tweens.add({
          targets: this.picture,
          scale: WORD_PICTURE_SCALE,
          duration: 300,
          ease: 'Back.easeOut',
        });
      }
    }

    if (hasPicture) {
      const corner = left + PICTURE_MARGIN + PICTURE_BOX - 4;
      this.speaker?.setPosition(corner, PICTURE_BOX / 2 - 8).setScale(SPEAKER_BADGE_SCALE);
    } else {
      this.speaker?.setPosition(left + 30, 0).setScale(1);
    }
  }

  /** Chạm tranh: lắc nhẹ */
  private wiggle(): void {
    const { picture } = this;
    if (!picture) return;
    this.scene.tweens.killTweensOf(picture);
    picture.setAngle(0).setScale(WORD_PICTURE_SCALE);
    this.scene.tweens.add({
      targets: picture,
      angle: { from: -8, to: 8 },
      duration: 80,
      yoyo: true,
      repeat: 1,
      onComplete: () => picture.setAngle(0),
    });
  }

  private fill(index: number): void {
    const slot = this.slots[index];
    if (!slot) return;
    const color = THEME.letterColors[index % THEME.letterColors.length];
    slot.hint.setText('');
    slot.letter.setText(this.word[index]).setColor(color);
    this.drawSlot(slot, 'filled', slot.letter.y);
    this.scene.tweens.add({
      targets: slot.letter,
      scale: { from: 1.7, to: 1 },
      duration: 260,
      ease: 'Back.easeOut',
    });

    this.current = index + 1;
    const next = this.slots[this.current];
    if (next) this.drawSlot(next, 'current', next.letter.y);
    this.pointCursor();
  }

  /** Hoàn thành từ: panel sáng viền vàng, các chữ nảy lần lượt */
  private celebrate(): void {
    this.cursorTween?.stop();
    if (this.picture?.visible) {
      this.scene.tweens.killTweensOf(this.picture);
      this.picture.setScale(WORD_PICTURE_SCALE).setAngle(0);
      this.scene.tweens.add({
        targets: this.picture,
        scale: WORD_PICTURE_SCALE * 1.2,
        duration: 180,
        yoyo: true,
        repeat: 1,
        ease: 'Quad.easeOut',
      });
    }
    this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 1, to: 0 },
      duration: 900,
      ease: 'Quad.easeIn',
    });
    this.slots.forEach((slot, index) => {
      this.scene.tweens.add({
        targets: slot.letter,
        y: slot.letter.y - 8,
        duration: 150,
        delay: index * 70,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    });
  }

  /** Hứng nhầm: ô đang cần hứng chuyển xám, panel lắc nhẹ */
  private fail(): void {
    this.cursorTween?.stop();
    const slot = this.slots[this.current];
    if (slot) this.drawSlot(slot, 'failed', slot.letter.y);
    this.scene.tweens.add({
      targets: this.root,
      x: { from: this.root.x - 5, to: this.root.x + 5 },
      duration: 60,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.root.setX(this.centerX),
    });
  }

  /** Nhịp đập nhẹ ở ô đang cần hứng */
  private pointCursor(): void {
    this.cursorTween?.stop();
    const slot = this.slots[this.current];
    this.slots.forEach((s) => s.box.setScale(1));
    if (!slot) return;
    slot.box.setPosition(slot.x, slot.letter.y);
    this.cursorTween = this.scene.tweens.add({
      targets: slot.box,
      scale: 1.08,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawSlot(slot: Slot, state: 'empty' | 'current' | 'filled' | 'failed', y: number): void {
    const { box, size } = slot;
    const h = Math.round(size * 1.12);
    const styles = {
      empty: { fill: 0xffffff, line: 0xd9b98a, width: 3 },
      current: { fill: 0xfffbe8, line: 0xffb000, width: 4 },
      filled: { fill: 0xeaffea, line: 0x5ccf4a, width: 3 },
      failed: { fill: 0xe8e0dc, line: 0x9a8f88, width: 3 },
    }[state];
    // Vẽ quanh (0,0) rồi đặt box vào tâm ô để có thể scale nhịp đập
    box.clear();
    box.setPosition(slot.x, y);
    box.fillStyle(styles.fill, 1).fillRoundedRect(-size / 2, -h / 2, size, h, 8);
    box.lineStyle(styles.width, styles.line, 1).strokeRoundedRect(-size / 2, -h / 2, size, h, 8);
  }
}
