import type { GameId, StudentGameStatus, UnlockSource } from '@phonics/contracts';

/**
 * Trạng thái một game của học sinh đang đăng nhập (từ `StudentGameStatus` của BE, GET /me/games).
 * Field giữ nguyên tên như contracts (chưa cần getter FE nào).
 */
export class StudentGameModel {
  readonly gameId: GameId;
  /** Server đã mở (admin / GV mở, miễn phí, hoặc đã ghi nhận mở bằng kim cương) */
  readonly unlocked: boolean;
  readonly source: UnlockSource | null;
  readonly unlockedAt: string | null;
  /** Điểm học sinh đã kiếm được ở game này */
  readonly points: number;
  readonly rounds: number;

  constructor(data: StudentGameStatus) {
    this.gameId = data.gameId;
    this.unlocked = data.unlocked;
    this.source = data.source;
    this.unlockedAt = data.unlockedAt;
    this.points = data.points;
    this.rounds = data.rounds;
  }
}
