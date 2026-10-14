/**
 * Giữ đại dương luôn đông cá kiểu Feeding Frenzy (GAMEPLAY_AND_ASSET_GUIDE §6–7 của pack):
 *   - cá nhỏ bơi theo BẦY (4–7 con cùng màu, cùng hướng, xếp so le), cá vừa lẻ / đôi, cá mú lớn hiếm
 *   - thiếu cá ở cỡ nào thì thả bầy mới từ mép trái / phải, làn ngẫu nhiên trong vùng bơi
 *   - không thả cá ngay sát cá của bé
 * Dùng cho cả OceanScene (ăn được) và LobbyScene (chỉ để trang trí).
 */
import Phaser from 'phaser';
import { SCHOOL_FRAMES } from '@/games/phonics-ocean/game/config/sprites';
import { SCHOOL } from '@/games/phonics-ocean/game/config/theme';
import SchoolFish from '@/games/phonics-ocean/game/objects/SchoolFish';
import { canEat, type SchoolSize } from '@/games/phonics-ocean/session/frenzy';
import { pickRandom } from '@/core/utils/random';

const SIZES: readonly SchoolSize[] = ['tiny', 'medium', 'big'];

/** "tiny" -> ["tiny.gray", "tiny.pink", ...] */
const KINDS: Record<SchoolSize, string[]> = {
  tiny: Object.keys(SCHOOL_FRAMES).filter((kind) => kind.startsWith('tiny.')),
  medium: Object.keys(SCHOOL_FRAMES).filter((kind) => kind.startsWith('medium.')),
  big: Object.keys(SCHOOL_FRAMES).filter((kind) => kind.startsWith('big.')),
};

export default class SchoolDirector {
  fishes: SchoolFish[] = [];
  private clock = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly bounds: Phaser.Geom.Rectangle,
    /** Hệ số số lượng (Lobby thưa hơn) */
    private readonly density = 1,
  ) {}

  /** Thả sẵn cá khắp màn lúc bắt đầu (không phải chờ cá bơi vào) */
  populate(avoid: { x: number; y: number } | null): void {
    SIZES.forEach((size) => {
      while (this.count(size) < this.target(size)) this.spawn(size, avoid, true);
    });
  }

  update(deltaMs: number, speedScale: number, threat: { x: number; y: number; tier: number } | null): void {
    this.fishes.forEach((fish) => {
      const edible = threat !== null && canEat(threat.tier, fish.size);
      fish.update(deltaMs, this.bounds, speedScale, edible ? threat : null);
    });
    this.fishes = this.fishes.filter((fish) => !fish.finished);

    this.clock += deltaMs;
    if (this.clock < SCHOOL.refillMs) return;
    this.clock = 0;
    // Mỗi lần chỉ thả một bầy để cá vào màn rải đều
    const missing = SIZES.find((size) => this.count(size) < this.target(size));
    if (missing) this.spawn(missing, threat, false);
  }

  remove(fish: SchoolFish): void {
    this.fishes = this.fishes.filter((item) => item !== fish);
  }

  private target(size: SchoolSize): number {
    return Math.max(size === 'tiny' ? 4 : 1, Math.round(SCHOOL[size].target * this.density));
  }

  private count(size: SchoolSize): number {
    return this.fishes.filter((fish) => fish.size === size).length;
  }

  /**
   * @param anywhere true = đặt sẵn trong màn (lúc bắt đầu); false = bơi vào từ mép
   */
  private spawn(size: SchoolSize, avoid: { x: number; y: number } | null, anywhere: boolean): void {
    const kinds = KINDS[size];
    if (kinds.length === 0) return;
    const config = SCHOOL[size];
    const frames = SCHOOL_FRAMES[pickRandom(kinds)];
    const fromLeft = Math.random() < 0.5;
    const speed = Phaser.Math.Between(config.speed[0], config.speed[1]) * (fromLeft ? 1 : -1);
    const { bounds } = this;
    let y = Phaser.Math.Between(bounds.y + 24, bounds.bottom - 24);
    let x = anywhere
      ? Phaser.Math.Between(bounds.x + 30, bounds.right - 30)
      : fromLeft
        ? bounds.x - config.width
        : bounds.right + config.width;
    // Không đặt sát cá của bé
    if (anywhere && avoid && Phaser.Math.Distance.Between(x, y, avoid.x, avoid.y) < 110) {
      x = avoid.x > bounds.centerX ? bounds.x + 40 : bounds.right - 40;
      y = Phaser.Math.Between(bounds.y + 24, bounds.bottom - 24);
    }
    const count = Phaser.Math.Between(config.group[0], config.group[1]);
    for (let i = 0; i < count; i += 1) {
      // Bầy so le: con sau lùi về phía đuôi, lệch lên / xuống
      const offsetX = -Math.sign(speed) * (i * config.width * 0.9 + Phaser.Math.Between(0, 6));
      const offsetY = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * config.width * 0.55;
      const fishY = Phaser.Math.Clamp(y + offsetY, bounds.y + 12, bounds.bottom - 12);
      this.fishes.push(
        new SchoolFish(
          this.scene,
          size,
          frames,
          x + offsetX,
          fishY,
          speed * Phaser.Math.FloatBetween(0.95, 1.05),
        ),
      );
    }
  }
}
