/**
 * Khung mục tiêu giữa trên cùng (GAMEPLAY_PHONICS_V2 §8) + nút loa lớn để nghe lại:
 *   âm / vần / cụm chữ  -> "FIND" + /m/, -at, sh
 *   nghe từ             -> "LISTEN!" + "?" (máy không đọc được thì hiện luôn từ)
 *   ôn tập              -> câu khung "I can see a ___."
 */
import Phaser from 'phaser';
import { DEPTH, THEME } from '@/games/phonics-ocean/game/config/theme';
import type { OceanLayout } from '@/games/phonics-ocean/game/ui/layout';
import { addText } from '@/games/phonics-ocean/game/ui/text';
import type { Question } from '@/games/phonics-ocean/session/types';
import { TEXT } from '@/games/phonics-ocean/session/text';

const SPEAKER_R = 24;

export default class TargetPanel extends Phaser.GameObjects.Container {
  private readonly caption: Phaser.GameObjects.Text;
  private readonly target: Phaser.GameObjects.Text;
  private readonly speaker: Phaser.GameObjects.Container;
  private readonly textX: number;
  private readonly textWidth: number;
  private speakingTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, layout: OceanLayout, onSpeaker: () => void) {
    const { x, y, width, height } = layout.target;
    super(scene, x, y);
    this.setDepth(DEPTH.HUD);

    const board = scene.add.graphics();
    board
      .fillStyle(THEME.hex.ink)
      .fillRoundedRect(-width / 2 - 3, -height / 2 - 3, width + 6, height + 6, 16);
    board.fillStyle(THEME.hex.wood).fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    board
      .fillStyle(THEME.hex.cream)
      .fillRoundedRect(-width / 2 + 52, -height / 2 + 5, width - 58, height - 10, 10);

    // Nút loa (nghe lại)
    this.speaker = scene.add.container(-width / 2 + 26, 0);
    const disc = scene.add.graphics();
    disc.fillStyle(THEME.hex.ink).fillCircle(0, 0, SPEAKER_R);
    disc.fillStyle(0x3f8cff).fillCircle(0, 0, SPEAKER_R - 3);
    disc.fillStyle(THEME.hex.white);
    disc.fillRect(-10, -5, 6, 10);
    disc.fillTriangle(-5, -5, 4, -12, 4, 12).fillTriangle(-5, -5, 4, 12, -5, 5);
    disc.lineStyle(2.5, THEME.hex.white).beginPath().arc(6, 0, 7, -0.9, 0.9).strokePath();
    this.speaker
      .add(disc)
      .setSize(SPEAKER_R * 2, SPEAKER_R * 2)
      .setInteractive({ useHandCursor: true });
    this.speaker.on(Phaser.Input.Events.POINTER_DOWN, onSpeaker);

    this.textX = 26;
    this.textWidth = width - 70;
    this.caption = addText(scene, this.textX, -height / 2 + 12, '', 'outline', {
      fontSize: '11px',
      color: THEME.colors.orange,
      strokeThickness: 0,
    });
    this.target = addText(scene, this.textX, 4, '', 'learning', { fontSize: '30px' });
    this.add([board, this.speaker, this.caption, this.target]);
    scene.add.existing(this);
  }

  show(question: Question): void {
    if (question.sentence) {
      this.caption.setText(TEXT.listen);
      this.target.setText(
        question.hidden ? question.sentence : question.sentence.replace('___', question.answer),
      );
      this.target.setFontSize(22);
    } else if (question.mode === 'word') {
      this.caption.setText(TEXT.listen);
      this.target.setText(question.hidden ? '?' : question.display).setFontSize(30);
    } else {
      this.caption.setText(TEXT.find);
      this.target.setText(question.display).setFontSize(32);
    }
    this.target.setY(question.sentence ? 6 : 5);
    // Câu dài: thu nhỏ cho vừa khung
    const scale = Math.min(1, this.textWidth / Math.max(1, this.target.width));
    this.target.setScale(scale);
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1.15, to: 1 },
      duration: 260,
      ease: 'Back.easeOut',
    });
  }

  /** Lộ đáp án trong câu khung sau khi ăn đúng */
  reveal(question: Question): void {
    if (!question.hidden) return;
    this.target.setText(
      question.sentence ? question.sentence.replace('___', question.answer) : question.answer,
    );
    this.target.setScale(Math.min(1, this.textWidth / Math.max(1, this.target.width)));
  }

  setSpeaking(speaking: boolean): void {
    this.speakingTween?.stop();
    this.speakingTween = null;
    this.speaker.setScale(1);
    if (speaking) {
      this.speakingTween = this.scene.tweens.add({
        targets: this.speaker,
        scale: 1.15,
        duration: 260,
        yoyo: true,
        repeat: -1,
      });
    }
  }
}
