/**
 * Đại dương phía sau các màn React (Home / Setup / Results): nền biome của cấp đang chọn (đổi cấp ở
 * Setup thì nền đổi theo), cá của bé bơi lượn, đàn cá nhỏ bơi qua, kèm nhạc menu
 * (màn kết quả giữ nhạc kết thúc do OceanScene phát).
 */
import Phaser from 'phaser';
import { getLevel } from '@/games/phonics-ocean/content/levels';
import { MUSIC } from '@/games/phonics-ocean/game/config/assets';
import { PREY_KEYS, playerFrame, PLAYER_FRAMES } from '@/games/phonics-ocean/game/config/sprites';
import { DEPTH, FEEL } from '@/games/phonics-ocean/game/config/theme';
import { SCENES } from '@/games/phonics-ocean/game/core/keys';
import { getAudio } from '@/games/phonics-ocean/game/core/services';
import OceanBackground from '@/games/phonics-ocean/game/objects/OceanBackground';
import { phonicsOceanStore, type Screen } from '@/games/phonics-ocean/session/store';
import { setupView, view } from '@/platform/phaser/view';
import { shuffle } from '@/shared/random';

export type LobbyScreen = Exclude<Screen, 'play'>;

const SCHOOL_SIZE = 6;

interface Swimmer {
  image: Phaser.GameObjects.Image;
  vx: number;
  baseY: number;
  phase: number;
}

export default class LobbyScene extends Phaser.Scene {
  private screen: LobbyScreen | null = null;
  private biome = '';
  private background: OceanBackground | null = null;
  private hero!: Phaser.GameObjects.Image;
  private heroFrame = 0;
  private heroTimer = 0;
  private swimmers: Swimmer[] = [];
  private elapsed = 0;

  constructor() {
    super(SCENES.LOBBY);
  }

  create({ screen }: { screen: LobbyScreen }): void {
    this.screen = null;
    this.biome = '';
    this.background = null;
    this.swimmers = [];
    this.elapsed = 0;
    const { width, height } = setupView(this);
    this.drawBackground();

    this.hero = this.add.image(width / 2, height * 0.7, playerFrame(2, 0)).setDepth(DEPTH.PLAYER);
    shuffle(PREY_KEYS)
      .slice(0, SCHOOL_SIZE)
      .forEach((key, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const image = this.add
          .image(Phaser.Math.Between(0, width), height * (0.2 + 0.12 * index), key)
          .setDepth(DEPTH.PREY)
          .setAlpha(0.9)
          .setFlipX(direction < 0);
        image.setScale((FEEL.preyWidth * 0.75) / image.width);
        this.swimmers.push({
          image,
          vx: Phaser.Math.Between(18, 34) * direction,
          baseY: image.y,
          phase: Math.random() * Math.PI * 2,
        });
      });

    // Đổi cấp ở Setup -> đổi nền theo biome của cấp
    const unsubscribe = phonicsOceanStore.subscribe(() => this.drawBackground());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
    this.setScreen(screen);
    this.cameras.main.fadeIn(300);
  }

  override update(_time: number, delta: number): void {
    const { width, height } = view(this);
    const dt = delta / 1000;
    this.elapsed += dt;

    // Cá của bé bơi hình số 8 ở nửa dưới (dưới logo / nút của màn React)
    const t = this.elapsed * 0.45;
    const x = width / 2 + Math.sin(t) * width * 0.32;
    const y = height * 0.74 + Math.sin(t * 2) * height * 0.06;
    const facing = Math.cos(t) >= 0 ? 1 : -1;
    this.hero.setPosition(x, y);
    this.heroTimer += delta;
    if (this.heroTimer >= FEEL.swimFrameMs * 1.4) {
      this.heroTimer = 0;
      this.heroFrame = (this.heroFrame + 1) % PLAYER_FRAMES[2];
      this.hero.setTexture(playerFrame(2, this.heroFrame));
    }
    const scale = (FEEL.playerHeight[2] * 1.3) / this.hero.height;
    this.hero.setScale(scale * facing, scale);

    this.swimmers.forEach((swimmer) => {
      swimmer.phase += dt * 2;
      swimmer.image.x += swimmer.vx * dt;
      swimmer.image.y = swimmer.baseY + Math.sin(swimmer.phase) * 5;
      const half = swimmer.image.displayWidth / 2;
      if (swimmer.vx > 0 && swimmer.image.x > width + half) swimmer.image.x = -half;
      if (swimmer.vx < 0 && swimmer.image.x < -half) swimmer.image.x = width + half;
    });
  }

  setScreen(screen: LobbyScreen): void {
    if (screen === this.screen) return;
    this.screen = screen;
    // Màn kết quả: nhạc kết thúc đã được OceanScene phát (xong jingle tự sang nhạc reward)
    if (screen !== 'results') getAudio(this).playMusic(MUSIC.MENU);
  }

  private drawBackground(): void {
    const { biome } = getLevel(phonicsOceanStore.get().draft.levelId);
    if (biome === this.biome) return;
    this.biome = biome;
    this.background?.destroy();
    const { width, height } = view(this);
    this.background = new OceanBackground(this, biome, new Phaser.Geom.Rectangle(0, 0, width, height));
  }
}
