/**
 * Ví kim cương của Phonics Arcade — dùng chung mọi game, lưu localStorage `phonics-arcade:wallet`.
 *
 *   - Nhận: chơi xong một ván, mỗi câu / từ đúng = GEM_RULES.perCorrect viên,
 *     tối đa GEM_RULES.maxPerSession viên mỗi ván (game gọi `awardGems`).
 *   - Tiêu: mở khoá game có `price` trong manifest (không có `price` = miễn phí, luôn mở).
 *   - Kim cương vừa nhận được giữ ở `pendingGain` để màn chọn game "đếm" lên cho bé thấy.
 *
 * Máy dùng chung cả lớp (Class Mode) thì kim cương là của cả lớp trên máy đó.
 */
import { createStore } from '@/core/store/createStore';
import { readJson, writeJson } from '@/core/storage/storage';
import type { GameManifest } from '@/core/types/game';

export const GEM_RULES = {
  perCorrect: 1,
  maxPerSession: 10,
} as const;

export interface WalletState {
  gems: number;
  /** Id các game đã mở khoá bằng kim cương */
  unlocked: string[];
  /** Kim cương nhận được từ lần cuối ở màn chọn game (chưa "đếm" cho bé xem) */
  pendingGain: number;
}

const WALLET_KEY = 'phonics-arcade:wallet';

const toCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

function load(): WalletState {
  const stored = readJson<WalletState>(WALLET_KEY) ?? {};
  return {
    gems: toCount(stored.gems),
    unlocked: Array.isArray(stored.unlocked) ? stored.unlocked.filter((id) => typeof id === 'string') : [],
    pendingGain: toCount(stored.pendingGain),
  };
}

export const walletStore = createStore<WalletState>(load());
walletStore.subscribe(() => writeJson(WALLET_KEY, walletStore.get()));

/** Số kim cương cho một ván có `correct` câu / từ đúng */
export function gemsForCorrect(correct: number): number {
  return Math.min(GEM_RULES.maxPerSession, toCount(correct) * GEM_RULES.perCorrect);
}

/** Cộng kim cương sau một ván; trả về số viên thực nhận (để màn kết quả hiện "+N") */
export function awardGems(correct: number): number {
  const amount = gemsForCorrect(correct);
  if (amount > 0) {
    walletStore.set((state) => ({
      ...state,
      gems: state.gems + amount,
      pendingGain: state.pendingGain + amount,
    }));
  }
  return amount;
}

/** Màn chọn game lấy số vừa nhận để chạy hiệu ứng đếm, rồi xoá */
export function takePendingGain(): number {
  const { pendingGain } = walletStore.get();
  if (pendingGain > 0) walletStore.set((state) => ({ ...state, pendingGain: 0 }));
  return pendingGain;
}

export function isUnlocked(game: GameManifest, state: WalletState = walletStore.get()): boolean {
  return !game.price || state.unlocked.includes(game.id);
}

/** Trừ kim cương và mở khoá; false nếu không đủ */
export function unlockGame(game: GameManifest): boolean {
  const state = walletStore.get();
  if (isUnlocked(game, state)) return true;
  const price = game.price ?? 0;
  if (state.gems < price) return false;
  walletStore.set({ ...state, gems: state.gems - price, unlocked: [...state.unlocked, game.id] });
  return true;
}
