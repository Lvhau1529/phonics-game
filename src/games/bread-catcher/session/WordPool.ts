/**
 * Chọn từ mục tiêu với ít lặp lại (plan §14).
 *
 *   - Từ đúng   -> tạm rút khỏi vòng quay (mastered).
 *   - Từ sai    -> ở lại để luyện tiếp, chỉ quay lại sau `retryAfterDraws` lượt rút.
 *   - Sàn dự trữ: khi vòng quay còn < `reserveFloorRatio` số từ ban đầu, mở lại
 *     các từ mastered đã lâu không gặp — nguồn luyện tập không bao giờ cạn.
 *
 * Thứ tự ưu tiên khi rút:
 *   1. từ chưa gặp
 *   2. từ sai đã đủ thời gian chờ
 *   3. từ đã thuộc, lâu nhất chưa gặp
 * `avoid` (từ của lượt này + của đội ngay trước) được tránh nếu còn lựa chọn khác.
 */
import { pickRandom } from '@/core/utils/random';

/**
 * unseen   — chưa gặp
 * failed   — sai, chờ luyện lại
 * review   — đã gặp / được mở lại từ sàn dự trữ, vẫn trong vòng quay
 * mastered — đã đúng, tạm rút khỏi vòng quay
 */
type Status = 'unseen' | 'failed' | 'review' | 'mastered';

interface Entry {
  word: string;
  status: Status;
  /** Số thứ tự lần rút gần nhất (-1 = chưa rút) */
  lastSeen: number;
  /** Lần rút lúc bị sai (chỉ có ý nghĩa khi status = failed) */
  failedAt: number;
}

export interface WordPoolRules {
  retryAfterDraws: number;
  reserveFloorRatio: number;
}

export default class WordPool {
  private readonly entries: Map<string, Entry>;
  private draws = 0;

  constructor(
    words: readonly string[],
    private readonly rules: WordPoolRules,
  ) {
    if (words.length === 0) throw new Error('WordPool: empty word list');
    this.entries = new Map(
      words.map((word) => [word, { word, status: 'unseen', lastSeen: -1, failedAt: -1 }]),
    );
  }

  draw(avoid: ReadonlySet<string> = new Set()): string {
    this.refillReserve();
    const all = [...this.entries.values()];
    const retryReady = (e: Entry) =>
      e.status === 'failed' && this.draws - e.failedAt >= this.rules.retryAfterDraws;

    const tiers: Entry[][] = [
      all.filter((e) => e.status === 'unseen'),
      all.filter(retryReady),
      all.filter((e) => e.status === 'review'),
      all.filter((e) => e.status === 'mastered'),
      all, // bất đắc dĩ: kể cả từ sai chưa đủ thời gian chờ
    ];

    for (const strict of [true, false]) {
      for (const tier of tiers) {
        const candidates = strict ? tier.filter((e) => !avoid.has(e.word)) : tier;
        if (candidates.length > 0) return this.take(candidates);
      }
    }
    throw new Error('WordPool: nothing to draw'); // không xảy ra: `all` luôn có phần tử
  }

  /** Hoàn thành đúng: tạm rút khỏi vòng quay */
  markCorrect(word: string): void {
    const entry = this.entries.get(word);
    if (entry) entry.status = 'mastered';
  }

  /** Sai (hoặc hết giờ giữa chừng): giữ lại để luyện, chờ vài lượt rút mới quay lại */
  markWrong(word: string): void {
    const entry = this.entries.get(word);
    if (!entry) return;
    entry.status = 'failed';
    entry.failedAt = this.draws;
  }

  private take(candidates: Entry[]): string {
    // Từ chưa gặp: ngẫu nhiên; còn lại: ưu tiên từ lâu nhất chưa gặp
    const oldest = Math.min(...candidates.map((e) => e.lastSeen));
    const entry = pickRandom(candidates.filter((e) => e.lastSeen === oldest));
    this.draws += 1;
    entry.lastSeen = this.draws;
    if (entry.status === 'unseen' || entry.status === 'review') entry.status = 'review';
    return entry.word;
  }

  /** Sàn dự trữ: mở lại từ đã thuộc khi vòng quay quá mỏng */
  private refillReserve(): void {
    const floor = Math.ceil(this.entries.size * this.rules.reserveFloorRatio);
    const all = [...this.entries.values()];
    const active = all.filter((e) => e.status !== 'mastered').length;
    if (active >= floor) return;

    all
      .filter((e) => e.status === 'mastered')
      .sort((a, b) => a.lastSeen - b.lastSeen)
      .slice(0, floor - active)
      .forEach((e) => {
        e.status = 'review';
      });
  }
}
