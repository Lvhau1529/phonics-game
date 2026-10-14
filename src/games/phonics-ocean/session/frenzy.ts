/**
 * Ăn cá kiểu Feeding Frenzy (thuần TS, scene chỉ gọi):
 *   - đàn cá có 3 cỡ: tiny (cá nhỏ theo bầy) · medium · big. Cá của bé cỡ `tier` (1–3) ăn được cá cỡ
 *     nhỏ hơn mình (`rank < tier`): cỡ 1 ăn cá nhỏ, cỡ 2 ăn thêm cá vừa, cỡ 3 ăn cả cá mú lớn.
 *     Cá to hơn / bằng mình thì chỉ va bật ra (không mất tim — tim chỉ mất khi bị cá săn mồi cắn).
 *   - ăn liên tục đầy thanh FRENZY -> FRENZY! trong một lúc: điểm ×2, bơi nhanh hơn.
 *     Thanh tự vơi dần nếu không ăn; va vào cá to thì mất một nửa thanh.
 * Lớn lên + qua màn vẫn chỉ nhờ ăn ĐÚNG cá mang chữ (session/round.ts) — ăn cá thường để vui và lấy điểm.
 */
export type SchoolSize = 'tiny' | 'medium' | 'big';

export const SCHOOL_RANK: Record<SchoolSize, number> = { tiny: 0, medium: 1, big: 2 };

export const FRENZY = {
  points: { tiny: 10, medium: 25, big: 60 } as Record<SchoolSize, number>,
  /** Lượng thanh FRENZY mỗi con (0–1) */
  fill: { tiny: 0.1, medium: 0.18, big: 0.3 } as Record<SchoolSize, number>,
  /** Ăn đúng cá mang chữ cũng làm đầy thanh */
  wordFill: 0.25,
  /** Thanh vơi mỗi giây khi không ăn */
  decayPerSec: 0.05,
  /** Không vơi trong khoảng này sau mỗi lần ăn (ms) */
  graceMs: 1500,
  durationMs: 6000,
  multiplier: 2,
  speedBoost: 1.25,
  bumpLoss: 0.5,
} as const;

export const canEat = (tier: number, size: SchoolSize): boolean => SCHOOL_RANK[size] < tier;

export class FrenzyMeter {
  /** 0–1 */
  level = 0;
  /** Còn bao lâu (ms) trạng thái FRENZY! */
  activeMs = 0;
  private graceMs = 0;

  get active(): boolean {
    return this.activeMs > 0;
  }

  get multiplier(): number {
    return this.active ? FRENZY.multiplier : 1;
  }

  /** Thanh hiển thị: lúc FRENZY! là thời gian còn lại */
  get display(): number {
    return this.active ? this.activeMs / FRENZY.durationMs : this.level;
  }

  /** Ăn một con cá thường; trả về điểm (đã nhân FRENZY) và có vừa bật FRENZY! không */
  eat(size: SchoolSize): { points: number; started: boolean } {
    const points = FRENZY.points[size] * this.multiplier;
    return { points, started: this.fill(FRENZY.fill[size]) };
  }

  /** Ăn đúng cá mang chữ */
  word(): boolean {
    return this.fill(FRENZY.wordFill);
  }

  bump(): void {
    if (!this.active) this.level = Math.max(0, this.level - FRENZY.bumpLoss);
  }

  tick(deltaMs: number): void {
    if (this.active) {
      this.activeMs = Math.max(0, this.activeMs - deltaMs);
      return;
    }
    if (this.graceMs > 0) {
      this.graceMs = Math.max(0, this.graceMs - deltaMs);
      return;
    }
    this.level = Math.max(0, this.level - (FRENZY.decayPerSec * deltaMs) / 1000);
  }

  private fill(amount: number): boolean {
    this.graceMs = FRENZY.graceMs;
    if (this.active) return false;
    this.level = Math.min(1, this.level + amount);
    // Cộng số thực (0.1 × 10) có thể ra 0.999…: coi như đầy
    if (this.level < 1 - 1e-6) return false;
    this.level = 0;
    this.activeMs = FRENZY.durationMs;
    return true;
  }
}
