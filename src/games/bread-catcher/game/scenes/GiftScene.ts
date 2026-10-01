/**
 * Winner's Gift (plan §23): đội thắng chọn 1 trong 3 hộp quà.
 * Đồng hạng nhất -> lần lượt từng đội đều được mở quà.
 * Nội dung quà lấy từ session/rewards.ts (đang là placeholder).
 */
import Phaser from 'phaser';
import { MUSIC, mascotTexture } from '@/games/bread-catcher/game/config/assets';
import { SFX } from '@/platform/audio/sfx';
import { DEPTH, THEME } from '@/games/bread-catcher/game/config/gameConfig';
import { STAGE_BACKGROUNDS } from '@/games/bread-catcher/game/config/stages';
import { SCENES } from '@/games/bread-catcher/game/core/keys';
import { getAudio } from '@/games/bread-catcher/game/core/services';
import { isLandscape, setupView, view } from '@/platform/phaser/view';
import { addStageBackground } from '@/games/bread-catcher/game/objects/StageBackground';
import IconButton from '@/games/bread-catcher/game/ui/IconButton';
import TextButton from '@/games/bread-catcher/game/ui/TextButton';
import { addText } from '@/games/bread-catcher/game/ui/text';
import { fitText } from '@/platform/phaser/text';
import { rankTeams, winnersOf, type Standing } from '@/games/bread-catcher/session/ranking';
import { REWARDS } from '@/games/bread-catcher/session/rewards';
import { appStore, sessionActions } from '@/games/bread-catcher/session/sessionStore';
import { UI_TEXT } from '@/games/bread-catcher/session/text';
import { shuffle } from '@/shared/random';

const GIFT_COUNT = 3;
const GIFT_SPACING = 108;
/** Icon phần thưởng vẽ ở 2x (hiển thị ~60px), đặt cao hơn nắp hộp ngần này */
const REWARD_ICON_SCALE = 0.5;
const REWARD_ICON_LIFT = 26;

/**
 * Vị trí các phần (toạ độ logic).
 * Dọc: xếp từ trên xuống. Ngang: đội thắng bên trái, hộp quà + phần thưởng bên phải.
 */
interface GiftLayout {
  winnerX: number;
  giftsX: number;
  mascotScale: number;
  /** Tên đội dài hơn thì cắt "…" */
  nameMaxWidth: number;
  titleY: number;
  mascotY: number;
  nameY: number;
  promptY: number;
  giftsY: number;
  cardY: number;
  buttonsY: number;
}

function giftLayout(scene: Phaser.Scene): GiftLayout {
  const { width, height } = view(scene);
  if (isLandscape(scene)) {
    return {
      winnerX: width * 0.27,
      giftsX: width * 0.66,
      mascotScale: 2,
      nameMaxWidth: width * 0.5,
      titleY: height * 0.16,
      mascotY: height * 0.44,
      nameY: height * 0.72,
      promptY: height * 0.14,
      giftsY: height * 0.38,
      cardY: height * 0.64,
      buttonsY: height * 0.87,
    };
  }
  return {
    winnerX: width / 2,
    giftsX: width / 2,
    mascotScale: 1.3,
    nameMaxWidth: width - 40,
    titleY: height * 0.1,
    mascotY: height * 0.27,
    nameY: height * 0.4,
    promptY: height * 0.47,
    giftsY: height * 0.64,
    cardY: height * 0.8,
    buttonsY: height * 0.93,
  };
}

export default class GiftScene extends Phaser.Scene {
  private winners: Standing[] = [];
  private winnerIndex = 0;
  private layer!: Phaser.GameObjects.Container;
  private stars!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super(SCENES.GIFT);
  }

  create(): void {
    setupView(this);
    const session = appStore.get().session;
    if (!session) return;
    this.winners = winnersOf(rankTeams(session.teams, session.results));
    this.winnerIndex = 0;

    addStageBackground(this, STAGE_BACKGROUNDS[2], 0xa89888);
    this.stars = this.add
      .particles(0, 0, 'star', {
        speed: { min: 120, max: 280 },
        angle: { min: 200, max: 340 },
        scale: { start: 0.6, end: 0 },
        rotate: { min: -180, max: 180 },
        gravityY: 320,
        lifespan: 900,
        emitting: false,
      })
      .setDepth(DEPTH.FX);
    new IconButton(this, 30, 30, 'back', () => sessionActions.backToResults()).setDepth(DEPTH.HUD);

    getAudio(this).playMusic(MUSIC.GIFT);
    this.showWinner();
    this.cameras.main.fadeIn(300);
  }

  private showWinner(): void {
    const layout = giftLayout(this);
    const standing = this.winners[this.winnerIndex];
    if (!standing) return;
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const title = addText(this, layout.winnerX, layout.titleY, UI_TEXT.winner, 'title', { fontSize: '44px' });
    const mascot = this.add
      .image(layout.winnerX, layout.mascotY, mascotTexture(standing.team.mascot))
      .setScale(layout.mascotScale);
    const crown = this.add.image(layout.winnerX, mascot.y - mascot.displayHeight / 2 - 8, 'crown');
    const name = fitText(
      addText(this, layout.winnerX, layout.nameY, standing.team.name, 'title', {
        fontSize: '30px',
        color: THEME.colors.cream,
      }),
      layout.nameMaxWidth,
    );
    const prompt = addText(
      this,
      layout.giftsX,
      layout.promptY,
      `${UI_TEXT.openGift} ${UI_TEXT.chooseBox}`,
      'outline',
      {
        fontSize: '18px',
        color: THEME.colors.gold,
      },
    );
    this.layer.add([title, mascot, crown, name, prompt]);
    this.tweens.add({
      targets: [mascot, crown],
      y: '-=8',
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({ targets: title, scale: { from: 0, to: 1 }, duration: 400, ease: 'Back.easeOut' });

    const rewards = shuffle(REWARDS);
    const gifts = Array.from({ length: GIFT_COUNT }, (_, index) => {
      const x = layout.giftsX + (index - (GIFT_COUNT - 1) / 2) * GIFT_SPACING;
      const gift = this.add
        .image(x, layout.giftsY, `gift_closed_${String(index + 1).padStart(2, '0')}`)
        .setInteractive({ useHandCursor: true });
      this.tweens.add({
        targets: gift,
        angle: { from: -5, to: 5 },
        duration: 300 + index * 60,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.layer.add(gift);
      return gift;
    });

    gifts.forEach((gift, index) => {
      gift.once(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        gifts.forEach((other) => other.disableInteractive());
        this.openGift(gifts, index, rewards[index % rewards.length], prompt);
      });
    });
  }

  private openGift(
    gifts: Phaser.GameObjects.Image[],
    index: number,
    reward: (typeof REWARDS)[number],
    prompt: Phaser.GameObjects.Text,
  ): void {
    const layout = giftLayout(this);
    const gift = gifts[index];
    const audio = getAudio(this);
    prompt.setVisible(false);

    // Hộp được chọn bay vào giữa -> ẩn hẳn các hộp còn lại để không bị chồng hình
    gifts.forEach((other) => {
      this.tweens.killTweensOf(other);
      if (other !== gift) this.tweens.add({ targets: other, alpha: 0, scale: 0.6, duration: 250 });
    });
    this.tweens.add({
      targets: gift,
      x: layout.giftsX,
      scale: 1.3,
      angle: 0,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(350, () => {
      audio.playSfx(SFX.GIFT_OPEN);
      gift.setTexture(`gift_open_${String(index + 1).padStart(2, '0')}`);
      this.stars.explode(24, gift.x, gift.y - 20);
      this.cameras.main.flash(200, 255, 244, 200);

      const card = this.add.container(layout.giftsX, layout.cardY);
      const bg = this.add.graphics();
      bg.fillStyle(0xfff4dc, 1).fillRoundedRect(-150, -46, 300, 92, 16);
      bg.lineStyle(4, 0x3b1a0b, 1).strokeRoundedRect(-150, -46, 300, 92, 16);
      card.add([
        bg,
        addText(this, 0, -20, reward.title, 'heading', { fontSize: '22px', color: THEME.colors.orange }),
        addText(this, 0, 16, reward.description, 'label', { fontSize: '15px', wordWrap: { width: 270 } }),
      ]);
      this.layer.add(card);
      this.tweens.add({ targets: card, scale: { from: 0, to: 1 }, duration: 350, ease: 'Back.easeOut' });
      this.showRewardIcon(reward, gift);

      this.time.delayedCall(700, () => this.showActions());
    });
  }

  /** Icon phần thưởng (ảnh 2x) bay lên từ miệng hộp rồi nhún nhảy phía trên hộp */
  private showRewardIcon(reward: (typeof REWARDS)[number], gift: Phaser.GameObjects.Image): void {
    if (!reward.iconKey || !this.textures.exists(reward.iconKey)) return;
    const icon = this.add.image(gift.x, gift.y, reward.iconKey).setScale(0);
    this.layer.addAt(icon, this.layer.getIndex(gift));
    const top = gift.y - gift.displayHeight / 2 - REWARD_ICON_LIFT;
    this.tweens.add({
      targets: icon,
      y: top,
      scale: REWARD_ICON_SCALE,
      duration: 450,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: icon,
          y: top - 6,
          duration: 650,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });
  }

  private showActions(): void {
    const { giftsX: x, buttonsY: y } = giftLayout(this);
    const hasNext = this.winnerIndex < this.winners.length - 1;

    if (hasNext) {
      this.layer.add(
        new TextButton(
          this,
          x,
          y,
          UI_TEXT.nextWinner,
          () => {
            this.winnerIndex += 1;
            this.showWinner();
          },
          { color: 'green', width: 220 },
        ),
      );
      return;
    }
    this.layer.add([
      new TextButton(this, x - 82, y, UI_TEXT.playAgain, () => sessionActions.playAgain(), {
        color: 'green',
        width: 156,
        fontSize: 18,
        sfx: SFX.UI_START,
      }),
      new TextButton(this, x + 82, y, UI_TEXT.home, () => sessionActions.goHome(), {
        color: 'blue',
        width: 140,
        fontSize: 18,
      }),
    ]);
  }
}
