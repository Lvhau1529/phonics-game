/**
 * Luật của "đại dương sống" (GAMEPLAY_PHONICS_V3 §9) — thuần TS, scene chỉ gọi và diễn:
 *   - NAM CHÂM (vật phẩm): trong MAGNET.durationMs, cá mang chữ ĐÚNG ở gần (≤ MAGNET.radius) bị hút dần về
 *     miệng cá của bé — giúp bé đang gặp khó; cá sai không bị hút.
 *   - BẠN ĐỒNG HÀNH (chỉ trang trí, không va chạm): rùa thỉnh thoảng bơi chậm ngang qua; cá heo lướt qua
 *     ăn mừng khi bé đạt chuỗi đúng / RHYME COMBO / lớn thêm một cỡ.
 *   - CHƯỚNG NGẠI: chỉ ở biome sâu (từ twilight_trench). Chạm vào: KHÔNG mất tim (tim chỉ mất khi bị cá săn
 *     mồi cắn), chỉ choáng nhẹ như ăn nhầm + mất nửa thanh FRENZY như va cá to. Bong bóng bảo vệ đỡ được
 *     (không vỡ). Đi theo công tắc cá săn mồi ở Setup: chế độ luyện tập không có chướng ngại.
 */
import type { Biome } from '@/games/phonics-ocean/content/schema';

// ---------------------------------------------------------------------------
// Nam châm
// ---------------------------------------------------------------------------
export const MAGNET = {
  durationMs: 6000,
  /** Chỉ hút cá đúng trong bán kính này quanh miệng (px logic) */
  radius: 240,
  /** Tốc độ hút (px/s) */
  pullPerSec: 110,
} as const;

export class MagnetState {
  /** Còn bao lâu (ms) */
  activeMs = 0;

  get active(): boolean {
    return this.activeMs > 0;
  }

  /** Nhặt thêm khi đang bật thì nạp lại đủ thời gian (không cộng dồn) */
  start(): void {
    this.activeMs = MAGNET.durationMs;
  }

  tick(deltaMs: number): void {
    this.activeMs = Math.max(0, this.activeMs - deltaMs);
  }
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Quãng cá đúng bị hút về miệng trong deltaMs: 0 nếu ngoài bán kính; không vượt quá điểm đích.
 */
export function magnetPull(fish: Point, mouth: Point, deltaMs: number): Point {
  const dx = mouth.x - fish.x;
  const dy = mouth.y - fish.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || distance > MAGNET.radius) return { x: 0, y: 0 };
  const step = Math.min(distance, (MAGNET.pullPerSec * deltaMs) / 1000);
  return { x: (dx / distance) * step, y: (dy / distance) * step };
}

// ---------------------------------------------------------------------------
// Bạn đồng hành
// ---------------------------------------------------------------------------
export const COMPANIONS = {
  /** Rùa đầu tiên sau khoảng này, sau đó mỗi turtleEveryMs (± jitter) */
  firstTurtleMs: 6000,
  turtleEveryMs: 20000,
  turtleJitterMs: 5000,
  /** Cá heo ăn mừng mỗi chuỗi đúng bội số này */
  dolphinStreak: 5,
} as const;

/** Cá heo lướt qua ăn mừng? (chuỗi 5, 10... / RHYME COMBO / lớn thêm một cỡ) */
export function dolphinCheers(streak: number, rhymeCombo: boolean, grew: boolean): boolean {
  return rhymeCombo || grew || (streak > 0 && streak % COMPANIONS.dolphinStreak === 0);
}

// ---------------------------------------------------------------------------
// Chướng ngại vùng nước sâu
// ---------------------------------------------------------------------------
/**
 * jelly — sứa trôi lên chậm · mine — thuỷ lôi trôi ngang (chạm thì "POP" thành bong bóng)
 * crab — cua bò dọc đáy · rock — đá rơi chậm từ trên xuống
 */
export type HazardKind = 'jelly' | 'mine' | 'crab' | 'rock';

/** Biome nông (rạn san hô, rừng tảo, vịnh tàu đắm) không có chướng ngại */
export const HAZARD_KINDS: Record<Biome, readonly HazardKind[]> = {
  coral_reef: [],
  kelp_forest: [],
  shipwreck_bay: [],
  twilight_trench: ['jelly', 'mine'],
  abyss_cave: ['jelly', 'mine', 'crab'],
  volcanic_ruins: ['jelly', 'crab', 'rock'],
};

export const HAZARD = {
  /** Không có chướng ngại trong khoảng đầu lượt (bé làm quen) */
  firstDelayMs: 8000,
  everyMs: 9000,
  /** Số chướng ngại cùng lúc nhiều nhất */
  max: { twilight_trench: 1, abyss_cave: 2, volcanic_ruins: 2 } as Partial<Record<Biome, number>>,
  /** Bé đang gặp khó (nhầm liên tiếp) -> chướng ngại ra thưa gấp đôi */
  calmRate: 0.5,
  /** Sau mỗi lần chạm, không tính chạm lại trong khoảng này (ms) */
  cooldownMs: 1500,
} as const;

export const hazardKinds = (biome: Biome): readonly HazardKind[] => HAZARD_KINDS[biome];

export interface HazardHit {
  /** Choáng nhẹ (như ăn nhầm) */
  stun: boolean;
  /** Mất nửa thanh FRENZY (như va cá to) */
  frenzyLoss: boolean;
  /** Luôn 0: chướng ngại không làm mất tim */
  heartsLost: 0;
  /** Bong bóng bảo vệ đã đỡ (bong bóng không vỡ) */
  blocked: boolean;
}

export function hazardHit(shielded: boolean): HazardHit {
  if (shielded) return { stun: false, frenzyLoss: false, heartsLost: 0, blocked: true };
  return { stun: true, frenzyLoss: true, heartsLost: 0, blocked: false };
}

/** Đồng hồ thả chướng ngại của một lượt */
export class HazardClock {
  /** Chướng ngại đầu tiên đúng lúc firstDelayMs */
  private clockMs: number = HAZARD.everyMs - HAZARD.firstDelayMs;
  private readonly kinds: readonly HazardKind[];
  private readonly max: number;

  constructor(biome: Biome) {
    this.kinds = hazardKinds(biome);
    this.max = HAZARD.max[biome] ?? 0;
  }

  get enabled(): boolean {
    return this.kinds.length > 0 && this.max > 0;
  }

  /** Trả về true khi tới lúc thả một chướng ngại mới */
  tick(deltaMs: number, { onScreen, calm }: { onScreen: number; calm: boolean }): boolean {
    if (!this.enabled) return false;
    this.clockMs += deltaMs * (calm ? HAZARD.calmRate : 1);
    if (this.clockMs < HAZARD.everyMs || onScreen >= this.max) return false;
    this.clockMs = 0;
    return true;
  }
}
