/**
 * Kiểu dữ liệu của Phonics Ocean — độc lập với React và Phaser.
 */
import type { QuestionMode } from '@/games/phonics-ocean/content/schema';

/** Nội dung form Setup (được nhớ lại cho lần sau) */
export interface SetupDraft {
  levelId: string;
  /** Có cá săn mồi (mất tim khi bị cắn) hay chơi luyện tập không có cá săn mồi */
  predators: boolean;
}

/** Một đề: mục tiêu ở HUD + các cá mang chữ (đúng 1 cá đúng) */
export interface Question {
  id: string;
  mode: QuestionMode;
  /** Id mục tiêu (âm / vần / cụm chữ / từ) — gom chuỗi vần, thống kê */
  targetId: string;
  /** Chữ trên HUD ("/m/", "-at", "sh", hoặc từ khi máy không đọc được) */
  display: string;
  /** Đề chỉ nghe (từ bị giấu trên HUD, hiện "?") */
  hidden: boolean;
  /** Câu khung của cấp ôn tập, vd "I can see a ___." */
  sentence?: string;
  /** Các đoạn giọng đọc khi ra đề / bấm loa */
  promptSpeech: string[];
  /** Từ đúng */
  answer: string;
  /** Mọi từ trên cá (gồm từ đúng), đã xáo */
  choices: string[];
  /** Đọc lại khi ăn đúng */
  feedbackSpeech: string[];
}

export interface WordRecord {
  word: string;
  /** Ăn đúng ngay, không ăn nhầm cá nào trước đó trong cùng đề */
  firstTry: boolean;
}

export type EndReason = 'cleared' | 'time' | 'caught';

export interface RoundResult {
  levelId: string;
  endedBy: EndReason;
  cleared: boolean;
  score: number;
  correct: number;
  /** Số lần ăn (đúng + nhầm) */
  attempts: number;
  accuracy: number;
  bestStreak: number;
  /** Cỡ cá cuối lượt (1–3) */
  tier: number;
  /** 0–3 sao; chưa qua màn = 0 */
  stars: number;
  words: WordRecord[];
}
