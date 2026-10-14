/**
 * Đại dương phía sau các màn React (Home / Setup / Results): nền biome của cấp đang chọn (đổi cấp ở
 * Setup thì nền đổi theo), cá của bé bơi lượn, đàn cá kiểu Feeding Frenzy bơi qua (chỉ trang trí),
 * kèm nhạc menu (màn kết quả giữ nhạc kết thúc do OceanScene phát).
 */
import Phaser from 'phaser';
import { getLevel } from '@/games/phonics-ocean/content/levels';
import { MUSIC } from '@/games/phonics-ocean/game/config/assets';
import { playerFrame, PLAYER_FRAMES } from '@/games/phonics-ocean/game/config/sprites';
import { DEPTH, FEEL } from '@/games/phonics-ocean/game/config/theme';
import { SCENES } from '@/games/phonics-ocean/game/core/keys';
import { getAudio } from '@/games/phonics-ocean/game/core/services';
import OceanBackground from '@/games/phonics-ocean/game/objects/OceanBackground';
import SchoolDirector from '@/games/phonics-ocean/game/systems/SchoolDirector';
import { phonicsOceanStore, type Screen } from '@/games/phonics-ocean/session/store';
import { setupView, view } from '@/platform/phaser/view';

export type LobbyScreen = Exclude<Screen, 'play'>;

/** Màn chờ thưa cá hơn màn chơi để không rối chữ của màn React */
const LOBBY_DENSITY = 0.7;

export default class LobbyScene extends Phaser.Scene {
  private screen: LobbyScreen | null = null;
  private biome = '';
  private background: OceanBackground | null = null;
  private schools!: SchoolDirector;
  private hero!: Phaser.GameObjects.Image;
  private heroFrame = 0;
  private heroTimer = 0;
  private elapsed = 0;

  constructor() {
    super(SCENES.LOBBY);
  }

  create({ screen }: { screen: LobbyScreen }): void {
    this.screen = null;
    this.biome = '';
    this.background = null;
    this.elapsed = 0;
    const { width, height } = setupView(this);
    this.drawBackground();

    this.hero = this.add.image(width / 2, height * 0.7, playerFrame(2, 0)).setDepth(DEPTH.PLAYER);
    this.schools = new SchoolDirector(this, new Phaser.Geom.Rectangle(0, 0, width, height), LOBBY_DENSITY);
    this.schools.populate(null);

    // Đổi cấp ở Setup -> đổi nền theo biome của cấp
    const unsubscribe = phonicsOceanStore.subscribe(() => this.drawBackground());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
    this.setScreen(screen);
    this.cameras.main.fadeIn(300);
  }

  override update(_time: number, delta: number): void {
    const { width, height } = view(this);
    this.elapsed += delta / 1000;

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

    this.schools.update(delta, 1, null);
    this.background?.follow(x, y);
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
