/**
 * Magic Dice — chọn đội chơi tiếp theo (plan §6), dùng lại sau mỗi lượt.
 *
 * Công bằng: thứ tự lượt đã được xáo MỘT LẦN khi bắt đầu buổi (sessionStore.turnOrder);
 * xúc xắc chỉ "hé lộ" đội kế tiếp trong thứ tự đó nên mỗi đội chơi đúng 1 lần.
 * Còn đúng 1 đội thì không cần đổ: hiện luôn "LAST TEAM" + đội đó + START.
 */
import Phaser from 'phaser';
import { MUSIC, mascotTexture } from '@/games/bread-catcher/game/config/assets';
import { SFX } from '@/core/audio/sfx';
import { DEPTH, THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { STAGE_BACKGROUNDS } from '@/games/bread-catcher/game/config/stages';
import { SCENES } from '@/games/bread-catcher/game/core/keys';
import { getAudio } from '@/games/bread-catcher/game/core/services';
import { isLandscape, setupView, view } from '@/core/phaser/view';
import { addStageBackground } from '@/games/bread-catcher/game/objects/StageBackground';
import { showConfirm } from '@/games/bread-catcher/game/scenes/overlay';
import IconButton from '@/games/bread-catcher/game/ui/IconButton';
import TextButton from '@/games/bread-catcher/game/ui/TextButton';
import { addText } from '@/games/bread-catcher/game/ui/text';
import { fitText } from '@/core/phaser/text';
import {
  appStore,
  currentTeam,
  sessionActions,
  type ActiveSession,
} from '@/games/bread-catcher/session/sessionStore';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import type { Team } from '@/games/bread-catcher/session/types';

/** Vị trí xúc xắc (tỉ lệ chiều cao) */
const DICE_Y = 0.41;
const TOKEN_RADIUS = 40;
const TOKEN_SPACING = { portrait: 112, landscape: 170 };
/** Nhịp nhảy của vòng sáng qua các đội: nhanh dần chậm lại (ms) */
const ROLL_STEPS = [70, 70, 80, 80, 90, 100, 110, 130, 150, 180, 220, 270];

interface Token {
  team: Team;
  root: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Graphics;
  done: boolean;
}

export default class TurnPickerScene extends Phaser.Scene {
  private session!: ActiveSession;
  private tokens: Token[] = [];
  private dice!: Phaser.GameObjects.Image;
  /** Nút chính: ROLL THE DICE! rồi START (Enter / Space cũng bấm được) */
  private actionButton?: TextButton;
  private rolling = false;

  constructor() {
    super(SCENES.TURN_PICKER);
  }

  create(): void {
    const { width, height } = setupView(this);
    const session = appStore.get().session;
    if (!session) return;
    this.session = session;
    this.rolling = false;
    this.actionButton = undefined;

    addStageBackground(this, STAGE_BACKGROUNDS[0], 0x8a7a6a);
    const isFirst = session.results.length === 0;
    const isLast = session.teams.length - session.results.length === 1;
    const title = isLast ? UI_TEXT.lastTeam : isFirst ? UI_TEXT.whoGoesFirst : UI_TEXT.nextTeam;
    addText(this, width / 2, height * 0.12, title, 'title');
    addText(
      this,
      width / 2,
      height * 0.12 + 40,
      `${UI_TEXT.turn} ${session.results.length + 1} / ${session.teams.length}`,
      'outline',
    );

    this.createTokens(height * 0.62);
    new IconButton(this, 30, 30, 'back', () => this.confirmLeave()).setDepth(DEPTH.HUD);
    this.input.keyboard?.on('keydown-ENTER', () => this.actionButton?.trigger());
    this.input.keyboard?.on('keydown-SPACE', () => this.actionButton?.trigger());
    getAudio(this).playMusic(MUSIC.TURN_PICKER);
    this.cameras.main.fadeIn(250);

    if (isLast) {
      const team = currentTeam(session);
      if (team) this.reveal(team, height * DICE_Y);
      return;
    }

    // Xúc xắc + bóng
    this.add.ellipse(width / 2, DICE_Y * height + 58, 110, 22, 0x000000, 0.3);
    this.dice = this.add.image(width / 2, DICE_Y * height, 'dice_5').setScale(1.4);
    this.tweens.add({
      targets: this.dice,
      y: this.dice.y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.actionButton = new TextButton(this, width / 2, height * 0.83, UI_TEXT.rollDice, () => this.roll(), {
      color: 'orange',
      width: 250,
      fontSize: 22,
      sfx: null,
    });
  }

  private createTokens(y: number): void {
    const cx = view(this).width / 2;
    const spacing = isLandscape(this) ? TOKEN_SPACING.landscape : TOKEN_SPACING.portrait;
    const played = new Set(this.session.results.map((result) => result.teamId));

    this.tokens = this.session.teams.map((team, index) => {
      const x = cx + (index - (this.session.teams.length - 1) / 2) * spacing;
      const done = played.has(team.id);

      const ring = this.add.graphics();
      ring
        .fillStyle(0xffd23f, 1)
        .fillCircle(0, 0, TOKEN_RADIUS + 8)
        .setVisible(false);
      const disc = this.add.graphics();
      disc.fillStyle(0xfff4dc, 1).fillCircle(0, 0, TOKEN_RADIUS);
      disc.lineStyle(4, 0x3b1a0b, 1).strokeCircle(0, 0, TOKEN_RADIUS);
      const mascot = this.add.image(0, -2, mascotTexture(team.mascot));
      mascot.setScale((TOKEN_RADIUS * 1.5) / mascot.height);
      const name = fitText(
        addText(this, 0, TOKEN_RADIUS + 18, team.name, 'outline', { fontSize: '15px' }),
        spacing - 8,
      );
      const root = this.add.container(x, y, [ring, disc, mascot, name]);

      if (done) {
        root.setAlpha(0.45);
        root.add(
          addText(this, TOKEN_RADIUS - 8, -TOKEN_RADIUS + 8, '✓', 'outline', {
            fontSize: '26px',
            color: THEME.colors.green,
          }),
        );
      }
      return { team, root, ring, done };
    });
  }

  private roll(): void {
    if (this.rolling) return;
    const selected = currentTeam(this.session);
    if (!selected) return;
    this.rolling = true;
    this.actionButton?.setVisible(false);

    const audio = getAudio(this);
    audio.playSfx(SFX.DICE_ROLL);
    this.tweens.killTweensOf(this.dice);
    this.tweens.add({ targets: this.dice, angle: 720, duration: 1100, ease: 'Cubic.easeOut' });

    // Vòng sáng chạy qua các đội còn lại rồi dừng ở đội được chọn
    const candidates = this.tokens.filter((token) => !token.done);
    const finalIndex = candidates.findIndex((token) => token.team.id === selected.id);
    const offset = finalIndex - ((ROLL_STEPS.length - 1) % candidates.length) + candidates.length * 4;

    let elapsed = 0;
    ROLL_STEPS.forEach((delay, step) => {
      elapsed += delay;
      this.time.delayedCall(elapsed, () => {
        this.dice.setTexture(`dice_${Phaser.Math.Between(1, 6)}`);
        this.highlight(candidates[(step + offset) % candidates.length]);
        audio.playSfx(SFX.UI_CLICK, { volumeScale: 0.6 });
        if (step === ROLL_STEPS.length - 1) this.time.delayedCall(250, () => this.reveal(selected));
      });
    });
  }

  private highlight(token: Token): void {
    this.tokens.forEach((t) => {
      t.ring.setVisible(t === token);
      t.root.setScale(t === token ? 1.12 : 1);
    });
  }

  /** Hiện đội được chọn + nút START; `bannerY` = chỗ ghi tên đội (mặc định phía trên xúc xắc) */
  private reveal(team: Team, bannerY = view(this).height * DICE_Y - 80): void {
    const { width, height } = view(this);
    this.rolling = false;
    const token = this.tokens.find((t) => t.team.id === team.id);
    if (token) this.highlight(token);
    getAudio(this).playSfx(SFX.TEAM_SELECTED);
    this.cameras.main.flash(200, 255, 240, 200);

    if (token) {
      this.tweens.add({
        targets: token.root,
        scale: 1.25,
        duration: 300,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: token.ring,
        alpha: { from: 1, to: 0.4 },
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
    }
    const banner = fitText(
      addText(this, width / 2, bannerY, `${team.name}!`, 'title', {
        fontSize: '38px',
        color: THEME.colors.cream,
      }),
      Math.min(width - 40, 520),
      '!',
    );
    this.tweens.add({ targets: banner, scale: { from: 0, to: 1 }, duration: 350, ease: 'Back.easeOut' });

    this.actionButton?.destroy();
    this.actionButton = new TextButton(
      this,
      width / 2,
      height * 0.83,
      UI_TEXT.start,
      () => this.scene.start(SCENES.GAME),
      { color: 'green', width: 220, fontSize: 24, sfx: SFX.UI_START },
    );
  }

  private confirmLeave(): void {
    if (this.rolling) return;
    showConfirm(this, {
      title: UI_TEXT.leaveGameQuestion,
      confirmLabel: UI_TEXT.leave,
      onConfirm: () => sessionActions.abortSession(),
      onCancel: () => undefined,
    });
  }
}
